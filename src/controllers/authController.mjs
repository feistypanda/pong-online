
import * as passwordUtils from '../utils/passwordUtils.mjs';
import * as db from '../db/db.mjs';
import config from "../config/env.mjs";

import { getToken } from "../utils/tokenUtils.mjs";

async function logIn (req, res) {
	const token = await getToken(req.user.username);

	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 1000 * 60 * 60 * config.accessToken.expiresIn,
	});

	res.json({ message: 'Login successful' });
}

export async function logInUser (req, res) {

	let {username, password} = req.body;

	// Validate username and password
	if (!username || !password) return res.status(400).json({ error: 'username and password are required' });

	username = username.toLowerCase();

	const users = db.getCollection('users');
	const user = await users.findOne({username});

	// Validate credentials
	if (!user) return res.status(400).json({ error: 'username and/or password incorrect' });

	const passwordValid = await passwordUtils.compare(password, user.hash);
	if (!passwordValid) return res.status(400).json({ error: 'username and/or password incorrect' });

	req.user = { username }
	logIn(req, res);
}

export async function registerUser (req, res) {
	let { username, password, confirmation } = req.body;

	// Validate username and password
	if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
	if (username.match(/[\W]/g)) return res.status(400).json({ error: 'username must only use letters, numbers, and underscores' });
	if (password.match(/[^\w `\-=\[\]\\;',\.\/~!@#\$%\^&\*\(\)_\+{}\|:"<>\?]/g)) return res.status(400).json({ error: 'password must only use letters, numbers, spaces, and symbols' });
	if (password !== confirmation) return res.status(400).json({ error: 'passwords do not match' });

	username = username.toLowerCase();

	// Check username availability
	const users = db.getCollection("users");
	const found = await users.find({username});
	const foundArr = await found.toArray();

	if (foundArr.length > 0) return res.status(400).json({ error: `username '${username}' is taken` });
	
	const hash = await passwordUtils.hash(password);

	// Store user in database
	users.insertOne({username, hash})

	req.user = { username }
	logIn(req, res);
}