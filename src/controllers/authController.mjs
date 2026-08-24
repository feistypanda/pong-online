
import * as passwordUtils from '../utils/passwordUtils.mjs';
import * as db from '../db/db.mjs';
import { ObjectId } from 'mongodb'
import config from "../config/env.mjs";

import { getToken, verifyToken } from "../utils/tokenUtils.mjs";

async function logIn (req, res) {
	
	const token = await getToken(req.user);
	const refreshToken = await getToken({id: req.user.id}, true);

	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 1000 * config.accessToken.expiresIn,
	});

	const refreshTokens = await db.getCollection('refreshTokens');
	await refreshTokens.insertOne({userId: req.user.id, refreshToken});

	res.json({ refreshToken, message: 'Login successful' });
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

	req.user = { username, id: user._id };
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
	const foundCursor = await users.find({username});
	const found = await foundCursor.toArray();

	if (found.length > 0) return res.status(400).json({ error: `username '${username}' is taken` });
	
	const hash = await passwordUtils.hash(password);

	// Store user in database
	await users.insertOne({username, hash});

	// get the id
	const user = await users.findOne({username});
	console.log (user);

	req.user = { username, id: user._id };
	logIn(req, res);
}

export async function refresh (req, res) {
	const { refreshToken } = req.body;

	try {
		const decoded = await verifyToken(refreshToken, true);

		const id = new ObjectId(decoded.id);
		const refreshTokens = await db.getCollection('refreshTokens').find({ userId: id, refreshToken });
		const arr = await refreshTokens.toArray();

		if (arr.length <= 0) return res.status(400).json({ error: 'Refresh token revoked' });

		const user = await db.getCollection('users').findOne({ _id: id });

		const token = await getToken({ username: user.username, id: decoded.id });

		res.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * config.accessToken.expiresIn,
		});

		res.json({ message: "success!" });
	} catch (e) {
		return res.status(400).json({ error: 'Invalid refresh token' });
	}
}

export async function logout (req, res) {

	const id = new ObjectId(req.user.id);
	await db.getCollection('refreshTokens').deleteMany({userId: id});

	res.clearCookie('token', { httpOnly: true });

	return res.redirect('/login');
}