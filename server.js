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
    setInterval(() => {
      this.tick();
    }, 250);
    // generate map??? i dunno
  }

  setSocket(socket) {
    this.socket = this.socket || socket;
  }

  assignPlayer(ab, socket) {
    // sets who is each player
  }

  updatePlayer(ab, data) {
    // just assign the velocity/tilt
  }

  tick() {
    this.io.emit('gameState',  {
      io: 2
    });
    if (this.socket) {
      this.socket.emit('gameState', {
        foo: 42
      });
    } else {
      console.log('no this.socket')
    }
    
    // broadscast calc game state
  }
}

const games = {
  foo: new Game(io)
};

io.on('connection', (socket) => {
  console.log('Client connected');

  games.foo.setSocket(socket);

  socket.on('playerLogIn', (response) => {
    console.log('server player log in', response);
    socket.emit('playerLogIn', response);
  })
  socket.on('disconnect', () => console.log('Client disconnected'));
});


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
