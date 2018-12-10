/* Debug */
const debug = require('debug')('RRS:Cockpit');

/* Submodules */
const controller = require('./../Controller');

/* Controllers */
const {
  Authentication,
  Connection,
  Movement,
} = require('./');

module.exports = (socket) => {
/* Default values */
  socket.authenticated = false;

  /* Controllers */
  socket = Connection(socket);
  socket = Authentication(socket, controller);
  socket = Movement(socket, controller);

  /**
 * Connect to the Steam Controller.
 * This is a work-around for the `error` event of the controller,
 * as we can't re-connect properly inside the `on` scope.
 */
  function connect() {
    controller.connect();
  }

  controller.on('connect', () => {
    if (!socket.connected) {
      socket.connect();
    }
  });

  controller.on('disconnect', () => {
    socket.disconnect();
  });

  controller.on('error', (err) => {
    socket.disconnect();

    /**
   * Error code 404 is only thrown if the Steam Controller is not found;
   * Ignoring the error message because we know what it will be.
   */
    if (err.code !== 404) {
      debug(err);
    }

    /**
   * Attempt re-connecting to the Steam Controller.
   */
    setTimeout(connect, 1000);
  });

  /**
 * Graceful shutdown of Controller and Socket.IO.
 */
  [
    'SIGINT',
    'SIGTERM',
  ].forEach((event) => {
    process.on(event, () => {
      controller.disconnect();
      socket.disconnect();

      process.exit(0);
    });
  });

  connect();

  return socket;
};
