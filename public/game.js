document.addEventListener('DOMContentLoaded', () => {
    let socket = io();

    document.getElementById('startGame').onclick = () => {
      const name = document.getElementById('playerName').value;
      if (!name) {
        alert('Enter your name');
        return;
      }

      socket.emit('playerLogIn', { name });

      const intro = document.getElementById('intro');
      intro.parentElement.removeChild(intro);

      const gameScene = document.createElement('div');
      gameScene.className = 'gameScene';
      document.body.appendChild(gameScene);

      const pacPerson = document.createElement('div');
      pacPerson.className = 'pacPerson';
      gameScene.appendChild(pacPerson);

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
        console.log('gameState', response);
        updatePlayersList(response.playersList);
        updateDebugList(response);
        updatePacPosition(response.pacPersonX, response.pacPersonY);
      });
    
      const updatePlayersList = (names) => {
        playersList.innerHTML = names.map((name) => {
          return `<li>${name}</li>`;
        }).join('');
      };

      const updateDebugList = (payload) => {
        debugList.innerHTML = (
          `<li>${payload.beta}</li><li>${payload.gamma}</li><li>${payload.pacPersonX}</li><li>${payload.pacPersonY}</li>`
        );
      };

      const updatePacPosition = (x, y) => {
        pacPerson.style.left = x + 'px';
        pacPerson.style.top = y + 'px';
      }

      let lastUpdate = Date.now();
      const deviceMotionHandler = e => {
        const newTime = Date.now();
        if ((newTime - lastUpdate) < 25) {
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
