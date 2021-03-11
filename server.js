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

    this.players = {};

    setInterval(() => {
      this.tick();
    }, 1000);
  }

  addPlayer(name) {
    console.log('adding player:', name)
    this.players[name] = {
      beta: 0,
      gamma: 0
    };
    this.io.emit('playerListUpdate', Object.keys(this.players));
  }

  updatePlayer(data) {
    console.log('got update for player', data.name);
    // { name: 'alex', x: 1, y: 2, z: 3 }
    this.players[data.name] = {
      beta: data.beta,
      gamma: data.gamma
    };
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

    // change this to velocity based
    // this.pacPersonX = this.pacPersonX + (beta / 4);
    // this.pacPersonY = this.pacPersonY + (gamma / 4);
    const secs = new Date().getSeconds();
    if (secs > 30) {
      this.pacPersonX = this.pacPersonX + 2;
      this.pacPersonY = this.pacPersonY + 2;  
    } else {
      this.pacPersonX = this.pacPersonX - 2;
      this.pacPersonY = this.pacPersonY - 2;  
    }

    this.io.emit('gameState',  {
      beta,
      gamma,
      pacPersonX: this.pacPersonX,
      pacPersonY: this.pacPersonY,
      playersList: Object.keys(this.players)
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