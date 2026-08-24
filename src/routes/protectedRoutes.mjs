
import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";

const router = express.Router();

// Index
router.get('/', authMiddleware, async (req, res) => {

	// const userData = await getJWT(req.cookies.token);
	
	// const username = userData.username;

	const users = db.getCollection("users");
	const user = await users.findOne({ username });

	res.render('index', { "title": "index", "user": "user"});
});

// Play
router.get('/play', requireAuth, async (req, res) => {
	res.render('play', { title: "play" });
});

// Stats
router.get('/stats', requireAuth, async (req, res) => {
	res.render('stats', { title: "stats" });
});

// Logout
router.get('/logout', requireAuth, async (req, res) => {

	// await redisClient.set(
	// 	`blacklist:${req.cookies.token}`, 
	// 	'true', 
	// 	'EX', 
	// 	3600 * tokenLifeHrs// Expire when token would expire anyway
	// );

	return res.redirect('/login');
})

export default router;