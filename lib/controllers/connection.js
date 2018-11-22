/* Debug */
const debug = require('debug')('RRS:Cockpit');

/**
 * Delay, in miliseconds, to reply on the heartbeat.
 */
const HEARTBEAT_DELAY = 10;

module.exports = (socket) => {
  socket.on('connect', () => {
    debug('Connected');
    clearInterval(socket.reconnectInterval);
  });

  function reconnect() {
    socket.connect();
  }

  socket.on('disconnect', (reason) => {
    debug('Disconnected', reason);
    socket.authenticated = false;

    /**
     * Invalid authorization token provided.
     * The Rover disconnected us, manual re-connect required.
     */
    if (reason === 'io server disconnect') {
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
