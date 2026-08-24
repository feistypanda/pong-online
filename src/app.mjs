
import path from 'path';

import authMiddleWare from './middleware/auth.mjs';
import cookieParser from 'cookie-parser';
import ejs from 'ejs';
import express from 'express';
import { logInUser, registerUser } from './controllers/authController.mjs'
import * as db from './db/db.mjs';

const port = 8000;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', '../public/views');


// Index
app.get('/', async (req, res) => {

	// const userData = await getJWT(req.cookies.token);
	
	// const username = userData.username;

	// const users = db.getCollection("users");
	// const user = await users.findOne({ username });

	res.render('index', { "title": "index", "user": false});
});

// Login
app.get('/login', async (req, res) => {
	res.render('login', { title: "login" });
});

app.post('/login', logInUser);

// Logout
app.get('/logout', authMiddleWare, async (req, res) => {
	return res.redirect('/login');
})

// Register
app.get('/register', async (req, res) => {
	res.render('register', { title: "register" });
});

app.post('/register', registerUser);

// Play
app.get('/play', authMiddleWare, async (req, res) => {
	res.render('play', { title: "play" });
});

// Stats
app.get('/stats', authMiddleWare, async (req, res) => {
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