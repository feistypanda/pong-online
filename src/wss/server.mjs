import { WebSocketServer } from 'ws';
import { verifyToken } from '../utils/tokenUtils.mjs';

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

const clients = new Set();

webSocketServer.on('connection', (socket) => {

	clients.add(socket);

	socket.on('message', (message) => {
		clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`${socket.username}: ${message}`);
			}
		});
	});

	socket.on('close', () => {
		clients.delete(socket);
	});

	socket.on('error', (error) => {
	    console.error(`Socket error: ${error.message}`);
	});
});
