
import { verifyToken } from "../utils/tokenUtils.mjs";

export default async function authMiddleWare (req, res, next) {

	const token = req.cookies.token;
	if (!token) return res.status(401).redirect("/login");

	verifyToken(token).then(decoded => {
		req.user = decoded;
		next();
	}).catch(e => {
		res.status(401).redirect("/login")
	})
}