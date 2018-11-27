/* Debug */
const debug = require('debug')('RRS:Cockpit');

/* Packages */
const Socket = require('socket.io-client');
const Epicenter = require('socket.io-client')('http://192.168.0.1:8080');
const Rover = require('./controllers/rover');

Epicenter.on('identify', (cb) => {
  cb('cockpit');
});

Epicenter.rover = undefined;
Epicenter.on('target', (ip) => {
  debug(`Connecting to: ${ip}`);

  if (Epicenter.rover !== undefined) {
    Epicenter.rover.authenticated = false;
    Epicenter.rover.removeAllListeners();
    Epicenter.rover.close();

    delete Epicenter.rover;
  }

  Epicenter.rover = Socket(`http://${ip}:3000`, { reconnection: false });
  Epicenter.rover = Rover(Epicenter.rover);
});

