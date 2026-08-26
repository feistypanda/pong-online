
const width = 1000;
const height = 600;

let lastLogged;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const AABB = (a, b) => a.position.x < b.position.x + b.width && a.position.x + a.width > b.position.x && a.position.y < b.position.y + b.height && a.position.y + a.height > b.position.y;

class Vector {
	constructor (x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	add (v) {
		return new Vector(this.x + v.x, this.y + v.y);
	}

	sub (v) {
		return new Vector(this.x - v.x, this.y - v.y);
	}

	mult (s) {
		return new Vector(this.x * s, this.y * s);
	}

	div (s) {
		return new Vector(this.x / s, this.y / s);
	}
}

class Paddle {
	constructor (x, y) {
		this.position = new Vector(x, y);

		this.width = 40;
		this.height = 140;
	}
}

class Player {
	constructor (socket, playerNumber) {

		this.socket = socket;
		this.username = this.socket.username;
		this.playerNumber = playerNumber;

		this.paddle = new Paddle(50 + playerNumber * (width - 100), height/2);

		this.direction = '';

		this.socket.on('message', async (message) => {
			const msg = message.toString();

			if (msg === 'up') this.direction = msg;
			if (msg === 'down') this.direction = msg;
			if (msg === '') this.direction = '';
		});
	}

	run (dt) {
		if (this.direction === 'up') this.paddle.position.y -= 0.4 * dt;
		else if (this.direction === 'down') this.paddle.position.y += 0.4 * dt;

		this.paddle.position.y = clamp(this.paddle.position.y, this.paddle.height/2, height - this.paddle.height/2);
	}

	sendToSocket (data) {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(data));
		}
	}

	sendGameData (data) {
		data.iAm = this.playerNumber;

		this.sendToSocket(data);
	}
}

class Ball {
	constructor (x, y) {
		this.position = new Vector(x, y)
		this.velocity = new Vector(0.8, 0.3);

		this.size = 20;
	}

	collidingWith (player) {
		const playerW = player.paddle.width;
		const playerH = player.paddle.height;
		const playerPos = player.paddle.position.sub(new Vector(playerW/2, playerH/2));

		const thisW = this.size;
		const thisH = this.size;
		const thisPos = this.position.sub(new Vector(thisW/2, thisH/2));

		return AABB(
			{ position: playerPos, width: playerW, height: playerH},
			{ position: thisPos, width: thisW, height: thisH }
		);
	}

	moveX (dt, players) {
		
		this.position.x += this.velocity.x * dt;

		let scored = -1;
		if (this.position.x > width + this.size) {
			scored = 0;
			this.position = new Vector(width/2, height/2);
		} else if (this.position.x < -this.size) {
			scored = 1;
			this.position = new Vector(width/2, height/2);
		}

		if (scored !== -1) return scored;

		for (const i of players) {
			if (!this.collidingWith(i)) continue;
		 	
		 	if (this.velocity.x > 0) this.position.x = i.paddle.position.x - i.paddle.width/2 - this.size/2
		 	else this.position.x = i.paddle.position.x + i.paddle.width/2 + this.size/2

		 	this.velocity.x *= -1;
		}

		return -1;
	}

	moveY (dt, players) {
		this.position.y += this.velocity.y * dt;

		if (this.position.y > height - this.size/2) {
			this.position.y = height - this.size/2;
			this.velocity.y *= -1;
		} else if (this.position.y < this.size/2) {
			this.position.y = this.size/2;
			this.velocity.y *= -1;
		}

		for (const i of players) {
			if (!this.collidingWith(i)) continue;
		 	
		 	if (this.velocity.y > 0) this.position.y = i.paddle.position.y - i.paddle.height/2 - this.size/2
		 	else this.position.y = i.paddle.position.y + i.paddle.height/2 + this.size/2

		 	this.velocity.y *= -1;
		}
	}

	run (dt, players) {
		this.moveY(dt, players);
		return this.moveX(dt, players);
	}
}

export default class Game {
	constructor () {
		this.reset();
	}

	reset () {
		this.players = [];
		this.ball = new Ball(width/2, height/2);

		this.score = [0, 0];

		this.over = false;
		this.winner = false;
	}

	get started () { return this.players.length === 2; }

	get gameData () {

		const playerPositions = this.players.map(x => x.paddle.position);
		const usernames = this.players.map(x => x.username);
		const playerW = this.players.map(x => x.paddle.width);
		const playerH = this.players.map(x => x.paddle.height);

		const data = {
			status: 'game',
			playerPositions, playerW, playerH,
			ballPosition: this.ball.position,
			ballSize: this.ball.size,
			score: this.score,
			usernames
		};

		return data;
	}

	sendData () {
		let len = this.players.length;

		for (let i = 0; i < len; i ++) {
			if (len < 2) this.players[i].sendToSocket({status: 'waiting'});
			else this.players[i].sendGameData(this.gameData);
		}
	}

	addPlayer (socket) {

		console.log(socket.username, "connected");
		if (this.players.length >= 2 || this.over) return false;
		
		this.players.push(new Player(socket, this.players.length));
		return true;
	}

	endGameFromDisconnect (disconnected) {

		// send results & disconnect players
		for (const i of this.players) {
			i.sendToSocket({
				status: 'over',
				reason: 'disconnect',
				score: this.score,
				winner: (disconnected + 1) % this.players.length,
				usernames: this.players.map(x => x.username),
				iAm: i.playerNumber,
			})
			i.socket.close(1000, "game over");
		}
	}

	disconnectPlayer (socket) {

		console.log(socket.username, "disconnected");

		if (this.over) return; // game already ended
		this.over = true;

		for (let i = 0; i < this.players.length; i ++) if (this.players[i].socket === socket) return this.endGameFromDisconnect(i);

	}
	
	checkScoreForWin () {
		return (this.score[0] >= 11 || this.score[1] >= 11) && Math.abs(this.score[0] - this.score[1]) > 1;
	}

	endGameFromWin () {
		if (this.over) return;
		this.over = true;

		for (const i of this.players) {
			i.sendToSocket({
				status: 'over',
				reason: 'win',
				score: this.score,
				winner: this.score[0] > this.score[1] ? 0 : 1,
				usernames: this.players.map(x => x.username),
				iAm: i.playerNumber,
			})
			i.socket.close(1000, "game over");
		}
	}
	

	run (dt) {

		let dat = this.players.map(x => x.username);
		if (lastLogged !== JSON.stringify(dat)) {
			console.log(dat);
			lastLogged = JSON.stringify(dat);
		}

		if (this.over) return;

		if (!this.started) return this.sendData();

		for (const i of this.players) {
			i.run(dt);
		}

		const scored = this.ball.run(dt, this.players, this);
		if (scored !== -1) {
			this.score[scored] ++;
		}

		if (this.checkScoreForWin()) return this.endGameFromWin();

		this.sendData();
	}
}