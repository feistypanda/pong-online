
import express from "express";

const router = express.Router();

// Login
router.get('/login', async (req, res) => {
	res.render('login', { title: "login" });
});

router.post('/login', async (req, res) => {
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

	const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: `${tokenLifeHrs}h` });

	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 1000 * 60 * 60 * tokenLifeHrs,
	});

	res.json({ message: 'Login successful' });
});

// Register
router.get('/register', async (req, res) => {
	res.render('register', { title: "register" });
});

router.post('/register', async (req, res) => {

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

	const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: `${tokenLifeHrs}h` });

	res.cookie('token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 1000 * tokenLifeHrs,
	});

	res.json({ message: 'Register successful' });
});