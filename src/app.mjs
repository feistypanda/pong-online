
import path from 'path';

import ejs from 'ejs';
import express from 'express';
import bodyParser from 'body-parser';

import { closeDatabaseConnection, connectToDatabase, getCollection } from "./db.mjs";

const port = 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', '../public/views');

app.get('/', async (req, res) => {

	const usersCollection = getCollection("users");
	const cursor = await usersCollection.find({"username": "leo"});
	const documents = await cursor.toArray()

	res.render('index', { "title": "index", "users": documents});
});

app.get('/login', async (req, res) => {
	res.render('login', { title: "login" });
});

app.get('/register', async (req, res) => {
	res.render('register', { title: "register" });
});

app.post('/register', (req, res) => {
	res.render('register', { title: req.body.username });
});

app.get('/play', async (req, res) => {
	res.render('play', { title: "play" });
});

app.get('/stats', async (req, res) => {
	res.render('stats', { title: "stats" });
});

async function startServer () {
	try {
		await connectToDatabase();

		app.listen(port, () => {
			console.log(`Listening on port ${port}`);
		});
	} catch (e) {
		throw(e);
	}
}

startServer();