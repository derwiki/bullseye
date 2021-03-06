document.addEventListener('DOMContentLoaded', () => {
    let socket = io();
    const TICK = 25;

    document.getElementById('startGame').onclick = () => {
      const name = document.getElementById('playerName').value;
      if (!name) {
        alert('Enter your name');
        return;
      }

      console.log('playerLogin', name)
      socket.emit('playerLogIn', { name });

      const intro = document.getElementById('intro');
      intro.parentElement.removeChild(intro);

      const gameScene = document.createElement('div');
      gameScene.className = 'gameScene';
      document.body.appendChild(gameScene);

      /*
      const pacPerson = document.createElement('div');
      pacPerson.className = 'pacPerson';
      gameScene.appendChild(pacPerson);  // need to do based on gamestate
      */
      let pacPersons = {};

      const playersList = document.createElement('ul');
      playersList.className = 'playersList';
      gameScene.appendChild(playersList);

      const debugList = document.createElement('ul');
      debugList.className = 'debugList';
      gameScene.appendChild(debugList);

      socket.on('playerLogIn', (response) => {
        console.log('in socket on playerLogIn', response);
      });
      
      socket.on('gameState', (response) => {
        console.log(response);
        updatePlayersList(response.players);
        const names = Object.keys(response.players)
        names.forEach(name => {
          const {Xpct, Ypct} = response.players[name]
          updatePacPosition(name, Xpct, Ypct);
        })
        updateDebugList(response);
        updateBullseye(response);
      });
    
      const updatePlayersList = (players) => {
        playersList.innerHTML = Object.keys(players).map((name) => {
          return `<li><span class="score">${players[name].score} &nbsp;</span>${name}</li>`;
        }).join('');
      };

      const updateDebugList = (payload) => {
        debugList.innerHTML = (
          `<li>${payload.beta}</li>
          <li>${payload.gamma}</li>
          <li>${payload.pacPersonX}</li>
          <li>${payload.pacPersonY}</li>
          <li>${payload.isBullseye}</li>`
        );
      };

      const colors = ['red', 'orange', 'green', 'blue', 'indigo', 'violet'];
      const updatePacPosition = (name, x, y) => {
        let pacPerson = pacPersons[name];
        if (!pacPerson) {
          pacPerson = document.createElement('div');
          pacPerson.className = 'pacPerson';
          pacPerson.id = name;
          const color = colors[Object.keys(pacPersons).length];
          pacPerson.style.backgroundColor = color;
          pacPersons[name] = pacPerson;
          gameScene.appendChild(pacPerson);
        }
        pacPerson.style.left = x + '%';
        pacPerson.style.top = y + '%';
        console.log(pacPerson.style);
      }

      let lastConfetti = Date.now();
      let confettiCount = 0;
      const updateBullseye = (response) => {
        const names = Object.keys(response.players);
        names.forEach(name => {
          const { isBullseye } = response.players[name];
          if (isBullseye) {
            const newConfetti = Date.now();
            if ((newConfetti - lastConfetti) > 500) {
              lastConfetti = newConfetti;
              confettiCount++;
              confetti({
                particleCount: 80,
                spread: 40,
                origin: {
                  x: 0.5,
                  y: 0.5
                }
              });
            }
          }
        });
      }

      let lastUpdate = Date.now();
      const deviceMotionHandler = e => {
        const newTime = Date.now();
        if ((newTime - lastUpdate) < TICK) {
          return;
        }
        lastUpdate = newTime;

        const { beta, gamma } = e;
        socket.emit('clientGameEvent', {beta, gamma, name});
      }
    
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission()
              .then(permissionState => {
                  if (permissionState === 'granted') {
                      //window.addEventListener('devicemotion', deviceMotionHandler);
                      window.addEventListener('deviceorientation', deviceMotionHandler);
    
                  }
              })
              .catch(console.error);
      } else {
          // handle regular non iOS 13+ devices
      }
    };
});
