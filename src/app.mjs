

import path from 'path';

import ejs from 'ejs';
import express from 'express';

import { closeDatabaseConnection, connectToDatabase, getCollection } from "./db.mjs";

const port = 8000;
const app = express();

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', '../public/views');

app.get('/', async (req, res) => {

	const users = getCollection("users");
	const user = await users.findOne({"username": "leo"});

	res.render('index', { title: "index", message: user.username });
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