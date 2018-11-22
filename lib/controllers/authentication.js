/* Debug */
const debug = require('debug')('RRS:Cockpit');

module.exports = (socket, controller) => {
  socket.token = '';

  socket.on('authenticate', (cb) => {
    if (socket.token.length === 4 && socket.call !== undefined) {
      cb(socket.token);

      return;
    }

    debug('Enter the authorization code:');
    socket.call = cb;
  });

  socket.on('authenticated', () => {
    debug('Authorization successful!');
    socket.authenticated = true;
  });

  [
    'a',
    'b',
    'x',
    'y',
  ].forEach((button) => {
    controller[button].on('press', () => {
      /**
       * Token request has not been send yet.
       */
      if (socket.call === undefined) {
        return;
      }

      /**
       * Token already set.
       */
      if (socket.token.length === 4) {
        return;
      }

      socket.token += button.toUpperCase();
      process.stdout.write(`Token: ${socket.token}\r`);

      /**
       * Token set, attempt authorization.
       */
      if (socket.token.length === 4) {
        socket.call(socket.token);
      }
    });
  });

  return socket;
};
