
import ejs from 'ejs';
import express from 'express';
import path from 'path';

const port = 8000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', './public/views');

app.get('/', (req, res) => {
	res.render('index', { title: "index", message: 'Hola' });
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});