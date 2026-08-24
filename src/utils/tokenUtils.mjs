import jwt from "jsonwebtoken";
import config from "../config/env.mjs";

export function getToken (data, gettingRefreshToken = false) {

	const secret = gettingRefreshToken ? config.refreshToken.secret : config.accessToken.secret;
	const expires = gettingRefreshToken ? config.refreshToken.expiresIn : config.accessToken.expiresIn;

	const promise = new Promise((resolve, reject) => {
		jwt.sign(data, secret, { expiresIn: expires }, function(err, token) {
			if (err) reject(err);
			if (token) resolve(token);
		});
	});

	return promise;
}

export function verifyToken (token, verifyingRefreshToken = false) {

	const secret = verifyingRefreshToken ? config.refreshToken.secret : config.accessToken.secret;

	const promise = new Promise((resolve, reject) => {
		jwt.verify(token, secret, function(err, decoded) {
			if (err) reject(err);
			if (decoded) resolve(decoded);
		});
	});

	return promise;
}