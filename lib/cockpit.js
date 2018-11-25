/* Debug */
const debug = require('debug')('RRS:Cockpit');

/* Packages */
const Socket = require('socket.io-client');
const epic = require('socket.io-client')('http://:8080');
const Rover = require('./controllers/rover');

epic.on('identify', (cb) => {
  cb('cockpit');
});

epic.rover = undefined;
epic.on('target', (ip) => {
  debug(`Connecting to: ${ip}`);

  if (epic.rover !== undefined) {
    epic.rover.removeAllListeners();
    epic.rover.close();

    delete epic.rover;
  }

  epic.rover = Socket(`http://${ip}:3000`, { reconnection: false });
  epic.rover = Rover(epic.rover);
});

