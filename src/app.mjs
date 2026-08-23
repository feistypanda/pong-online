
import path from 'path';

import ejs from 'ejs';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

import * as db from "./db.mjs";

const saltRounds = 10;

const port = 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', '../public/views');

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

// Register
(() => {

const error = (res, message) => {
	const params = new URLSearchParams();
	params.set("e", message);
	res.redirect('/register?' + params.toString());
}

app.get('/register', async (req, res) => {
	res.render('register', { title: "register" });
});

app.post('/register', async (req, res) => {

	const username = String(req.body.username).toLowerCase();
	const password = String(req.body.password);
	const confirmation = String(req.body.confirmation);

	// Validate username
	if (!username || !password) return error(res, 'username and password are required');
	if (username.match(/[\W]/g)) return error(res, 'username must only use letters, numbers, and underscores');

	// Check username availability
	const users = db.getCollection("users");
	const found = await users.find({username});
	const foundArr = await found.toArray();
	if (foundArr.length > 0) return error( res, `username '${username}' is taken`)

	// Validate password
	if (password.match(/[^\w `\-=\[\]\\;',\.\/~!@#\$%\^&\*\(\)_\+{}\|:"<>\?]/g)) return error(
		res, 'password must only use letters, numbers, spaces, and symbols')
	if (password !== confirmation) return error(res, 'passwords do not match');

	const hash = await bcrypt.hash(password, saltRounds);

	// Store user in database
	users.insertOne({username, hash})

	res.redirect('/');
});

})();

// Play
app.get('/play', async (req, res) => {
	res.render('play', { title: "play" });
});

// Stats
app.get('/stats', async (req, res) => {
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