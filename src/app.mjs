
import path from 'path';

import ejs from 'ejs';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import * as db from "./db.mjs";
import * as bcrypt from "./passwords.mjs";

const port = 8000;
const app = express();

const SECRET_KEY = "testing";

app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', '../public/views');

// Middleware to require token
function requireAuth(req, res, next) {
	const token = req.cookies.token;

	if (!token) return res.status(401).json({ error: 'Not authenticated' });

	req.user = jwt.verify(token, SECRET_KEY, (err, decoded) => {
		if (err) {
			return res.status(403).json({ error: 'Invalid or expired token' });
		}

		// Attach user info to request
		req.user = decoded;
		next();
	});
}

// Index
app.get('/', async (req, res) => {

	const users = db.getCollection("users");
	const cursor = await users.find();
	const documents = await cursor.toArray()

	res.render('index', { "title": "index", "users": documents});
});

// Login
app.get('/login', async (req, res) => {
	res.render('login', { title: "login" });
});

app.post('/login', async (req, res) => {
	let {username, password} = req.body;

	// Validate username and password
	if (!username || !password) return res.status(400).json({ error: 'username and password are required' });

	username = username.toLowerCase();

	const users = db.getCollection('users');
	const user = await users.findOne({username});

	// Validate credentials
	if (!user) return res.status(400).json({ error: 'username and/or password incorrect' });

	const passwordValid = await bcrypt.compare(password, user.hash);
	if (!passwordValid) return res.status(400).json({ error: 'username and/or password incorrect' });

	// Sign JWT (expires in 24 hour)
	const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

	console.log (token);
	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 1000,
	});

	// Send token to client
	res.json({ token, message: 'Login successful' });
})

// Register
app.get('/register', async (req, res) => {
	res.render('register', { title: "register" });
});

app.post('/register', async (req, res) => {

	let { username, password, confirmation } = req.body;
	username = username.toLowerCase();

	// Validate username
	if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
	if (username.match(/[\W]/g)) return res.status(400).json({ error: 'username must only use letters, numbers, and underscores' });

	// Check username availability
	const users = db.getCollection("users");
	const found = await users.find({username});
	const foundArr = await found.toArray();
	if (foundArr.length > 0) return res.status(400).json({ error: `username '${username}' is taken` });

	// Validate password
	if (password.match(/[^\w `\-=\[\]\\;',\.\/~!@#\$%\^&\*\(\)_\+{}\|:"<>\?]/g)) return res.status(400).json({ error: 'password must only use letters, numbers, spaces, and symbols' });
	if (password !== confirmation) return res.status(400).json({ error: 'passwords do not match' });

	const hash = await bcrypt.hash(password);

	// Store user in database
	users.insertOne({username, hash})

	const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 1000,
	});

	res.json({ message: 'Register successful' });
});

// Play
app.get('/play', requireAuth, async (req, res) => {
	res.render('play', { title: "play" });
});

// Stats
app.get('/stats', requireAuth, async (req, res) => {
	res.render('stats', { title: "stats" });
});

async function startServer () {
	try {
		await db.connectToDatabase();

		app.listen(port, () => {
			console.log(`Listening on port ${port}`);
		});
	} catch (e) {
		throw(e);
	}
}

function killServer () {
	console.log("Killing Server");
	db.closeDatabaseConnection();
	process.exit(0);
}

process.on('SIGINT', killServer);
process.on('SIGQUIT', killServer);
process.on('SIGTERM', killServer);

startServer();