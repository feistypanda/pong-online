
import path from 'path';

import authMiddleWare from './middleware/auth.mjs';
import cookieParser from 'cookie-parser';
import ejs from 'ejs';
import express from 'express';
import { logInUser, registerUser, refresh, logout } from './controllers/authController.mjs'
import * as db from './db/db.mjs';
import { ObjectId } from 'mongodb';
import { webSocketServer, verifyWSSConnection } from './wss/server.mjs';

import fs from 'fs';
import { fileURLToPath } from 'url';

import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');

const viewsPath = path.join(__dirname, '../public/views');
console.log('Resolved views path:', viewsPath, '| exists:', fs.existsSync(viewsPath));
app.set('views', viewsPath);

function getUserData (req) {
	const users = db.getCollection('users');
	const id = new ObjectId(req.user.id);
	return users.findOne({_id: id});
}

// app routes
(() => {

// Index
app.get('/', authMiddleWare, async (req, res) => {

	const user = await getUserData(req);

	res.render('index', { "title": "index", user});
});

// Login
app.get('/login', async (req, res) => {
	res.render('login', { title: "login", user: false });
});

app.post('/login', logInUser);

// Logout
app.get('/logout', authMiddleWare, async (req, res) => {

	const user = await getUserData(req);
	res.render('logout', { "title": "log out", user });
})

app.post('/logout', authMiddleWare, logout)

// Register
app.post('/register', registerUser);

// Refresh token
app.post('/refresh', refresh);

// Play
app.get('/play', authMiddleWare, async (req, res) => {
	const user = await getUserData(req);
	res.render('play', { title: "play", user});
});

// Stats
app.get('/stats', authMiddleWare, async (req, res) => {
	const user = await getUserData(req);

	const users = db.getCollection('users');
	const sorted = await users.aggregate([{ $sort: { elo: -1 } }])
	const arr = await sorted.toArray();

	res.render('stats', { title: "stats", user, places: arr });
});})();

// Results
app.get('/results', authMiddleWare, async (req, res) => {
	const user = await getUserData(req);
	res.render('results', { title: "results", user });
});

// Elo
app.get('/api/myelo', authMiddleWare, async (req, res) => {
	const user = await getUserData(req);
	res.send(isNaN(user.elo) ? 0 : user.elo);
});

server.on('upgrade', verifyWSSConnection);

async function startServer () {
	try {
		await db.connectToDatabase();

		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
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