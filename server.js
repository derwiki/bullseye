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

class Game {
  constructor(io) {
    this.io = io;
    this.pacPersonX = 300;
    this.pacPersonY = 300;
    this.turnsInBullseye = 0;

    this.players = {};

    setInterval(() => {
      this.tick();
    }, 25);
  }

  addPlayer(name) {
    console.log('adding player:', name)
    this.players[name] = {
      beta: 0,
      gamma: 0,
      score: 0
    };
    this.io.emit('playerListUpdate', Object.keys(this.players));
  }

  updatePlayer({name, beta, gamma}) {
    console.log('got update for player', name);
    // { name: 'alex', x: 1, y: 2, z: 3 }
    this.players[name] = this.players[name] || {score: 0};
    this.players[name].beta = beta;
    this.players[name].gamma = gamma;
  }

  updateScore(name, newScore) {
    this.players[name].score = newScore;
  }

  tallyTilt(attr) {
    let result = 0;
    Object.keys(this.players).forEach((name) => {
      result += this.players[name][attr];
    });
    result = Math.min(180, result);
    result = Math.max(-180, result);
    return result;
  }

  tick() {
    const beta = this.tallyTilt('beta');
    const gamma = this.tallyTilt('gamma');
    console.log('total beta', beta);
    console.log('total gamma', gamma);
    
    // change this to velocity based
    const SPEED = 2;
    this.pacPersonX = this.pacPersonX + (gamma * SPEED);
    this.pacPersonY = this.pacPersonY + (beta * SPEED);
    const MAX_X = 500;
    const MAX_Y = 1000;
    if (this.pacPersonX > MAX_X - 0.08 * MAX_X) this.pacPersonX = MAX_X - 0.08 * MAX_X;
    if (this.pacPersonX < 0) this.pacPersonX = 0;
    if (this.pacPersonY > MAX_Y - 0.08 * MAX_Y) this.pacPersonY = MAX_Y - 0.08 * MAX_Y;
    if (this.pacPersonY < 0) this.pacPersonY = 0;

    const Xpct = this.pacPersonX / MAX_X * 100;
    const Ypct = this.pacPersonY / MAX_Y * 100

    const isBullseye = (
      (Xpct > 40 && Xpct < 60) && (Ypct > 45 && Ypct < 55)
    );

    if (!isBullseye) {
      this.turnsInBullseye = 0;
    } else {
      this.turnsInBullseye += 1;
      const playerNames = Object.keys(this.players);
      playerNames.forEach((name) => {
        this.updateScore(name, this.players[name].score + (playerNames.length - 1) * this.turnsInBullseye);
      })
    }
    
    this.io.emit('gameState',  {
      beta,
      gamma,
      pacPersonX: Xpct,
      pacPersonY: Ypct,
      players: this.players,
      isBullseye
    });
    // broadscast calc game state
  }
}

const games = {
  foo: new Game(io)
};

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('playerLogIn', (response) => {
    games.foo.addPlayer(response.name);
  })

  socket.on('clientGameEvent', (response) => {
    games.foo.updatePlayer(response);
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});