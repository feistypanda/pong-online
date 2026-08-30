
import { WebSocketServer } from 'ws';
import { verifyToken } from '../utils/tokenUtils.mjs';
import Game from './game.mjs';
import * as db from '../db/db.mjs';
import calculateELO from '../utils/elo.mjs';

export const webSocketServer = new WebSocketServer({ noServer: true });

export function verifyWSSConnection (request, socket, head) {
	const token = request.headers['sec-websocket-protocol'];

	verifyToken(token).then(decoded => {

		webSocketServer.handleUpgrade(request, socket, head, (socket) => {
			socket.username = decoded.username;
			socket.id = decoded.id;

			webSocketServer.emit('connection', socket, request);
		});

	}).catch(e => {
		socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		socket.destroy();
		return;
	})
}

let games = [];

let then = performance.now();

let gameLoop = setInterval(() => {
	
	let now = performance.now();
	let dt = now - then;
	then = now;

	for (var i = games.length - 1; i >= 0; i--) {
		games[i].run(dt);
		if (games[i].over) games.splice(i, 1);
	}

}, 30);

webSocketServer.on('connection', (socket) => {

	// check to see if the player is already in a game
	for (const i of games) for (const j of i.usernames) if (j === socket.username) return socket.close(1000, "Already in game")

	let result = false;
	let game;

	for (const i of games) {
		if (!i.full) {
			game = i;
			result = i.addPlayer(socket);
		}
	}

	// create new game if necesary
	if (!result) {
		games.push(new Game());
		game = games[games.length - 1];
		result = game.addPlayer(socket);
	}

	if (!result) return socket.close(1000, "lobby full");

	game.onOver(async (playerA, playerB, winner) => {
		const users = db.getCollection('users');

		const data = await Promise.all([
			users.findOne({ username: playerA.username }),
			users.findOne({ username: playerB.username }),
		]);

		if (isNaN(data[0].elo)) data[0].elo = 0;
		if (isNaN(data[1].elo)) data[1].elo = 0;

		const newElos = calculateELO(data[0].elo, data[1].elo, winner);

		users.updateOne({ username: playerA.username }, { $set: { elo: Math.max(0, newElos[0])} });
		users.updateOne({ username: playerB.username }, { $set: { elo: Math.max(0, newElos[1])} });

		return newElos.map((x, i) => x - data[i].elo);
	});

	socket.on('close', () => {
		game.disconnectPlayer(socket);
	});

	socket.on('error', (error) => {
	    console.error(`Socket error: ${error.message}`);
	});
});
