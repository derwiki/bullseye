'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

class Game {
  constructor(io) {
    this.io = io;
    this.pacPersonX = 0;
    this.pacPersonY = 0;

    this.players = {};

    setInterval(() => {
      this.tick();
    }, 1000);
  }

  addPlayer(name) {
    console.log('adding player:', name)
    this.players[name] = {
      x: 0,
      y: 0
    };
    this.io.emit('playerListUpdate', Object.keys(this.players));
  }

  updatePlayer(data) {
    console.log('got update for player', data.name);
    // { name: 'alex', x: 1, y: 2, z: 3 }
    this.players[data.name] = {
      x: data.x,
      y: data.y
    };
  }

  tallyTilt(attr) {
    let result = 0;
    Object.keys(this.players).forEach((name) => {
      result += this.players[name][attr];
    });
    return result;
  }

  tick() {
    const totalX = this.tallyTilt('x');
    const totalY = this.tallyTilt('y');

    this.pacPersonX = this.pacPersonX + totalX;
    this.pacPersonY = this.pacPersonY + totalY;

    this.io.emit('gameState',  {
      totalX,
      totalY,
      pacPersonX: this.pacPersonX,
      pacPersonY: this.pacPersonY
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
    console.log('server player log in', response);
    socket.emit('playerLogIn', response);
  })
  socket.on('disconnect', () => console.log('Client disconnected'));
  socket.on('clientGameEvent', (e) => {
    console.log('Client game event', e)
  });
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
