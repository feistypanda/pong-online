let data = {
	accessToken: {
		secret: "ooh ssdsdfaafecret",
		expiresIn: 900,
	},
	refreshToken: {
		secret: "ooh another",
		expiresIn: 43200,
	},
	db: {
		uri: 'mongodb://127.0.0.1:50079/?directConnection=true',
	}
};

if (process.env.NODE_ENV === 'production') {
	console.log('production');
	data.accessToken.secret = process.env.ACCESS_SECRET;
	data.refreshToken.secret = process.env.REFRESH_SECRET;
	data.db.uri = process.env.DATABASE_URI;
} else {
	console.log('developement');
}


export default data;
