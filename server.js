'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static('public'))
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);
const TICK = 25;
const MAX_X = 500;
const MAX_Y = 1000;

class Game {
  constructor(io) {
    this.io = io;
    this.players = {};

    setInterval(() => {
      this.tick();
    }, TICK);
  }

  addPlayer(name) {
    console.log('adding player:', name)
    this.players[name] = {
      beta: 0,
      gamma: 0,
      score: 0,
      x: Math.floor(Math.random() * MAX_X), // virtual grid
      y: Math.floor(Math.random() * MAX_Y), // virtual grid
      Xpct: 50, // %
      Ypct: 50, // %
      turnsInBullseye: 0,
      name,
    };

    while (this.checkCollisionsWithOtherPlayers(this.players[name])) {
      console.log(`random placement of ${name} collided with other player; re-randomizing`);
      this.players[name].x = Math.random() * MAX_X;
      this.players[name].y = Math.random() * MAX_Y;
    }

    console.log('player added:', this.players[name]);
    this.io.emit('playerListUpdate', Object.keys(this.players));
  }

  updatePlayer({name, beta, gamma}) {
    // { name: 'alex', x: 1, y: 2, z: 3 }
    if (!this.players[name]) {
      this.addPlayer(name);
    }
    this.players[name].beta = beta;
    this.players[name].gamma = gamma;
  }

  updateScore(name, newScore) {
    this.players[name].score = newScore;
  }

  // https://stackoverflow.com/questions/8331243/circle-collision-in-javascript
  checkCollision(p1x, p1y, r1, p2x, p2y, r2) {
    // console.log((r1 + r2) ** 2, (p1x - p2x) ** 2 + (p1y - p2y) ** 2);
    return (r1 + r2) ** 2 > (p1x - p2x) ** 2 + (p1y - p2y) ** 2;
  }

  checkPlayerCollision(player1, player2) {
    if (player1 === undefined || player2 === undefined) return false;
    return this.checkCollision(player1.x, player1.y, 40, player2.x, player2.y, 40);
  }

  checkCollisionsWithOtherPlayers(player) {
    const names = Object.keys(this.players);
    let found = false;
    names.forEach(name => {
        if (player.name !== name) {
          const collision = this.checkPlayerCollision(player, this.players[name]);
          //console.log(`${player.name} vs ${name}: ${collision}`);
          if (collision) {
            found = true;
          }
        }
    });
    return found;
  }

  tick() {
    
    // change this to velocity based
    const SPEED = 2;

    Object.keys(this.players).forEach((name) => {
      let {beta, gamma, x, y} = this.players[name];
      const oldX = x;
      const oldY = y;
      beta = Math.min(180, beta);
      beta = Math.max(-180, beta);
      gamma = Math.min(180, gamma);
      gamma = Math.max(-180, gamma);
      x = x + (gamma * SPEED);
      y = y + (beta * SPEED);
      if (x > MAX_X - 0.08 * MAX_X) x = MAX_X - 0.08 * MAX_X;
      if (x < 0) x = 0;
      if (y > MAX_Y - 0.08 * MAX_Y) y = MAX_Y - 0.08 * MAX_Y;
      if (y < 0) y = 0;

      const isCollision = this.checkCollisionsWithOtherPlayers(this.players[name]);
      if (isCollision) {
        x = Math.random() * MAX_X;
        y = Math.random() * MAX_Y;
      }

      const Xpct = x / MAX_X * 100;
      const Ypct = y / MAX_Y * 100
      this.players[name].x = x;
      this.players[name].y = y;
      this.players[name].Xpct = Xpct;
      this.players[name].Ypct = Ypct;
      this.players[name].beta = beta;
      this.players[name].gamma = gamma;

      const isBullseye = (
        (Xpct > 45 && Xpct < 55) && (Ypct > 47 && Ypct < 52)
      );

      this.players[name].isBullseye = isBullseye;
      if (isBullseye) {
        this.players[name].turnsInBullseye += 1;
        this.players[name].score += 1;
      }
    });
   
    this.io.emit('gameState',  { players: this.players });
  }
}

const games = {
  foo: new Game(io)
};

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('playerLogIn', (response) => {
    console.log('playerLogIn', response);
    games.foo.addPlayer(response.name);
  })

  socket.on('clientGameEvent', (response) => {
    games.foo.updatePlayer(response);
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});