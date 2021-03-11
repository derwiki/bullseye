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
  constructor(seed) {
    // generate map??? i dunno
  }

  assignPlayer(ab, socket) {
    // sets who is each player
  }

  updatePlayer(ab, data) {
    // just assign the velocity/tilt
  }

  tick() {
    // broadscast calc game state
  }
}

const games = {
  roomId: Game.new()
}

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('playerLogIn', (response) => {
    console.log('server player log in', response);
  })
  socket.on('disconnect', () => console.log('Client disconnected'));
});


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
