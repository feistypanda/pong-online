
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
		this.lastPingTime = performance.now();

		this.username = this.socket.username;
		this.playerNumber = playerNumber;

		this.paddle = new Paddle(50 + playerNumber * (width - 100), height/2);

		this.direction = '';

		this.socket.on('message', (message) => {
			const msg = message.toString();

			if (msg === 'up') this.direction = msg;
			if (msg === 'down') this.direction = msg;
			if (msg === '') this.direction = '';
			if (msg === 'ping') this.lastPingTime = performance.now();
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

const Ball = (() => {

	const PI = Math.PI;
	const padding = PI/8;

	function random (min, max) {
		return Math.random() * (max - min) + min;
	}

	function randomWithPadding (min, max) {
		return random(min + padding, max - padding);
	}

	class Ball {
		constructor (x, y) {
			this.reset(x, y);
		}

		reset (x, y) {
			this.position = new Vector(x, y)
			this.velocity = new Vector(0.8, 0.3);
			this.speed = 0.85;

			this.size = 20;

			this.turnToRandomAngle(Math.random() - 0.5);
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

			if (scored !== -1) {
				this.turnToRandomAngle(Math.random() - 0.5);
				return scored;
			}

			this.handleCollideWithPlayers('x', players);

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

			this.handleCollideWithPlayers('y', players);
		}

		handleCollideWithPlayers (axis, players) {
			let dimension = { x: 'width', y: 'height' }[axis];

			for (const i of players) {
				if (!this.collidingWith(i)) continue;
			 	
			 	if (this.velocity[axis] > 0) this.position[axis] = i.paddle.position[axis] - i.paddle[dimension]/2 - this.size/2
			 	else this.position[axis] = i.paddle.position[axis] + i.paddle[dimension]/2 + this.size/2
			 	
			 	
			 	if (axis === 'x') this.bounceX();
			 	else this.velocity[axis] *= -1;
			}
		}

		turnToRandomAngle (direction) {
			
			const spread = Math.PI/4;
			let dir = Math.random() * spread - spread / 2;

			if (direction < 0) dir += Math.PI;

			this.velocity.x = Math.cos(dir) * this.speed / 2;
			this.velocity.y = Math.sin(dir) * this.speed / 2;

		}

		bounceX () {

			let prevAngle = Math.atan2(this.velocity.y, this.velocity.x);
			
			if (prevAngle < 0) prevAngle += PI * 2;

			let newAngle;

			if (prevAngle < PI/2) {
			    newAngle = randomWithPadding(PI/2, PI);
			} else if (prevAngle < PI) {
			    newAngle = randomWithPadding(0, PI/2);
			} else if (prevAngle < PI * 3/2) {
			    newAngle = randomWithPadding(PI * 3/2, PI * 2);
			} else {
			    newAngle = randomWithPadding(PI, PI * 3/2);
			}

			this.velocity.x = Math.cos(newAngle) * this.speed;
			this.velocity.y = Math.sin(newAngle) * this.speed;
		}

		run (dt, players) {
			this.moveY(dt, players);
			return this.moveX(dt, players);
		}
	}

	return Ball;
})();

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

		this.timer = 3700;
		this.startCountDown = true;

		this.pointsTo = 11;
	}

	get usernames () {
		return this.players.map(x => x.username);
	}

	get full () {
		return this.players.length === 2;
	}

	get started () { return this.players.length === 2; }

	get gameData () {

		const playerPositions = this.players.map(x => x.paddle.position);
		const playerW = this.players.map(x => x.paddle.width);
		const playerH = this.players.map(x => x.paddle.height);

		const data = {
			status: 'game',
			countDown: this.startCountDown ? this.timer : 0,
			playerPositions, playerW, playerH,
			ballPosition: this.ball.position,
			ballSize: this.ball.size,
			score: this.score,
			usernames: this.usernames,
		};

		return data;
	}

	onOver (callback) {
		this.gameOverCallback = callback;
	}

	sendData () {
		let len = this.players.length;

		for (let i = 0; i < len; i ++) {
			if (len < 2) this.players[i].sendToSocket({status: 'waiting'});
			else this.players[i].sendGameData(this.gameData);
		}
	}

	addPlayer (socket) {

		if (this.players.length >= 2 || this.over) return false;
		
		this.players.push(new Player(socket, this.players.length));
		return true;
	}

	async endGameFromDisconnect (disconnected) {

		const data = {
			status: 'over',
			reason: 'disconnect',
			score: this.score,
			winner: (disconnected + 1) % this.players.length,
			usernames: this.usernames,
		}

		if (this.full) data.eloChange = await this.gameOverCallback(...this.usernames.map(x => { return { username: x } }), data.winner);

		// send results & disconnect players
		for (const i of this.players) {
			data.iAm = i.playerNumber;
			
			i.sendToSocket(data);
			i.socket.close(1000, "game over");
		}
	}

	disconnectPlayer (socket) {

		if (this.over) return; // game already ended
		this.over = true;

		for (let i = 0; i < this.players.length; i ++) if (this.players[i].socket === socket) return this.endGameFromDisconnect(i);
	}
	
	checkScoreForWin () {
		return (this.score[0] >= this.pointsTo || this.score[1] >= this.pointsTo) && Math.abs(this.score[0] - this.score[1]) > 1;
	}

	async endGameFromWin () {
		if (this.over) return;
		this.over = true;

		const data = {
			status: 'over',
			reason: 'win',
			score: this.score,
			winner: this.score[0] > this.score[1] ? 0 : 1,
			usernames: this.usernames,
		}

		data.eloChange = await this.gameOverCallback(...this.usernames.map(x => { return { username: x } }), data.winner);

		for (const i of this.players) {
			data.iAm = i.playerNumber;

			i.sendToSocket(data);
			i.socket.close(1000, "game over");
		}
	}

	handleLogging () {
		if (lastLogged !== JSON.stringify(this.usernames)) {
			console.log(this.usernames);
			lastLogged = JSON.stringify(this.usernames);
		}
	}

	handleTimer (dt) {
		if (this.timer <= 0) return;
		
		this.timer -= dt;

		if (this.timer <= 0) this.startCountDown = false;
	}
	
	runPlayers (dt) {
		for (const i of this.players) {
			i.run(dt);
		}
	}

	runBall (dt) {

		if (this.timer > 0) return this.ball.reset(width/2, height/2);

		const scored = this.ball.run(dt, this.players, this);

		if (scored === -1) return;
		
		this.score[scored] ++;
		this.timer = 1000;
	}

	timeoutPlayers () {
		for (const i of this.players) {
			if (performance.now() - i.lastPingTime > 3000) i.socket.close(1000, "inactive");
		}
		
	}

	run (dt) {

		this.timeoutPlayers();

		if (this.over) return;
		if (!this.started) return this.sendData();

		this.handleTimer(dt);

		this.runPlayers(dt);
		this.runBall(dt);

		if (this.checkScoreForWin()) return this.endGameFromWin();

		this.sendData();
	}
}