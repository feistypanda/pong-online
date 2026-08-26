
import { WebSocketServer } from 'ws';
import { verifyToken } from '../utils/tokenUtils.mjs';
import Game from './game.mjs';

export const wsPort = 8001;
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

let game = new Game();

let then = performance.now();

let gameLoop = setInterval(() => {
	
	let now = performance.now();
	let dt = now - then;
	then = now;

	game.run(dt)

	if (game.over) game.reset();
}, 30);

webSocketServer.on('connection', (socket) => {

	const result = game.addPlayer(socket);

	if (!result) {
		socket.write('Lobby full');
		socket.destroy();
	} else {
		socket.on('close', () => {
			game.disconnectPlayer(socket);
		});

		socket.on('error', (error) => {
		    console.error(`Socket error: ${error.message}`);
		});
	}
});
