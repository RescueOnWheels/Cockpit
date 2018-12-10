/* Debug */
const debug = require('debug')('RRS:Cockpit');

/**
 * Delay, in miliseconds, to reply on the heartbeat.
 */
const HEARTBEAT_DELAY = 10;

module.exports = (socket) => {
  let attempts = 0;

  socket.on('connect', () => {
    debug('Connected');

    clearInterval(socket.reconnectInterval);
    attempts = 0;
  });

  function reconnect() {
    socket.connect();
  }

  socket.on('disconnect', (reason) => {
    attempts += 1;

    if (socket.authenticated) {
      socket.authenticated = false;
    }

    debug('Disconnected', reason);

    /* Invalid authorization token provided. */
    if (reason === 'io server disconnect' && attempts > 3) {
      socket.token = '';
    }

    socket.reconnectInterval = setInterval(reconnect.bind(this), 5);
  });

  /**
   * Send `heartbeat` to the Rover.
   */
  function beat() {
    socket.emit('heartbeat');
  }

  socket.on('heartbeat', () => {
    setTimeout(beat.bind(this), HEARTBEAT_DELAY);
  });

  return socket;
};
