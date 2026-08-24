import jwt from "jsonwebtoken";
import config from "../config/env.mjs";

export function getToken (username) {

	const promise = new Promise((resolve, reject) => {
		jwt.sign({ username }, config.accessToken.secret, { expiresIn: config.accessToken.expiresIn + "h" }, function(err, token) {
			if (err) reject(err);
			if (token) resolve(token);
		});
	});

	return promise;
}

export function verifyToken (token) {

	const promise = new Promise((resolve, reject) => {
		jwt.verify(token, config.accessToken.secret, function(err, decoded) {
			if (err) reject(err);
			if (decoded) resolve(decoded);
		});
	});

	return promise;
}