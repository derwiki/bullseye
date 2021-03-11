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

      socket.on('playerLogIn', (response) => {
        console.log('in socket on playerLogIn', response);
      });
      
      socket.on('gameState', (response) => {
        updatePlayersList(response.playersList);
        console.log('gameState', response);
      });
    
      const updatePlayersList = (names) => {
        playersList.innerHTML = names.map((name) => {
          return `<li>${name}</li>`;
        })
      };

      const deviceMotionHandler = e => {
        const { beta, gamma } = e;
        socket.emit('clientGameEvent', {beta, gamma});
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
