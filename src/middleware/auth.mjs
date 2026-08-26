
import { verifyToken } from "../utils/tokenUtils.mjs";

export default async function authMiddleWare (req, res, next) {

	const token = req.cookies.token;
	if (!token) {
		
		const params = new URLSearchParams(); 
		params.append('redirecturl', req.originalUrl) 

		return res.status(401).redirect("/login?" + params);
	}

	verifyToken(token).then(decoded => {
		req.user = decoded;
		next();
	}).catch(e => {
		res.status(401).redirect("/login")
	})
}