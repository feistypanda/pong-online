
import express from 'express';
import path from 'path';

const port = 8000;
const app = express();


app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});