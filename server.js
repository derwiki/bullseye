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

class Game {
  constructor(io) {
    this.io = io;
    this.pacPersonX = 300;
    this.pacPersonY = 300;
    this.turnsInBullseye = 0; // deprec
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
      x: 300, // virtual grid
      y: 300, // virtual grid
      Xpct: 50, // %
      Ypct: 50, // %
      turnsInBullseye: 0,
    };
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
    
    // change this to velocity based
    const SPEED = 2;
    const MAX_X = 500;
    const MAX_Y = 1000;

    Object.keys(this.players).forEach((name) => {
      let {beta, gamma, x, y} = this.players[name];
      //console.log(name, x, y);
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

      //console.log(x, y);
      const Xpct = x / MAX_X * 100;
      const Ypct = y / MAX_Y * 100
      // console.log(name, x, Xpct, y, Ypct);
      this.players[name].x = x;
      this.players[name].y = y;
      this.players[name].Xpct = Xpct;
      this.players[name].Ypct = Ypct;
      this.players[name].beta = beta;
      this.players[name].gamma = gamma;

      const isBullseye = (
        (Xpct > 40 && Xpct < 60) && (Ypct > 45 && Ypct < 55)
      );

      if (isBullseye) {
        this.players[name].turnsInBullseye 
      }
      //console.log(this.players[name]);
    });
   

    const playerNames = Object.keys(this.players);
    playerNames.forEach((name) => {
      this.updateScore(name, this.players[name].score + (playerNames.length - 1) * this.turnsInBullseye);
    })

    this.io.emit('gameState',  {
      //beta,
      //gamma,
      players: this.players,
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
    console.log('playerLogIn', response);
    games.foo.addPlayer(response.name);
  })

  socket.on('clientGameEvent', (response) => {
    games.foo.updatePlayer(response);
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});