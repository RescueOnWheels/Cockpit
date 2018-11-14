/* Debug */
const debug = require('debug')('RRS:Cockpit');

/* Packages */
const socket = require('socket.io-client')('http://192.168.43.86:3000');

/* Submodules */
const controller = require('./Controller');

const self = this;
self.connected = false;
let token = '';

socket.on('connect', () => {
  debug('Connected');
  clearInterval(self.reconnectInterval);
});

/**
 * Send `heartbeat` to server.
 */
function beat() {
  socket.emit('heartbeat');
}

socket.on('heartbeat', () => {
  setTimeout(beat.bind(this), 10);
});

socket.on('authenticate', (cb) => {
  if (token.length === 4 && self.call !== undefined) {
    cb(token);

    return;
  }

  debug('Enter the authorization code:');
  self.call = cb;
});

socket.on('authenticated', () => {
  debug('Authorization successful!');
  self.connected = true;
});

function reconnect() {
  socket.connect();
}

socket.on('disconnect', (reason) => {
  debug('Disconnected', reason);
  self.connected = false;

  /**
   * Invalid authorization token provided.
   * The Rover disconnected us, manual re-connect required.
   */
  if (reason === 'io server disconnect') {
    token = '';
  }

  self.reconnectInterval = setInterval(reconnect.bind(this), 5);
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
    if (self.call === undefined) {
      return;
    }

    /**
     * Token already set.
     */
    if (token.length === 4) {
      return;
    }

    token += button.toUpperCase();

    /**
     * Token set, attempt authorization.
     */
    if (token.length === 4) {
      self.call(token);
    }
  });
});

let speed = 0;
let direction = 2;
let balance = 0;

controller.y.on('press', () => {
  if (token.length < 4) {
    return;
  }

  socket.emit('move', {
    speed: 0,
    direction: 2,
    balance: 0,
  });
});

let turnLeftRight;

let prevEmit = {
  speed,
  direction,
  balance,
};

/**
 * Emits a 'move' event with the `speed`, `direction` and `balance`;
 * This doesn't emit if the previous emit containted the same data.
 */
function emit() {
  if (!self.connected) {
    return;
  }

  if (turnLeftRight !== undefined) {
    return;
  }

  const toEmit = {
    speed,
    direction,
    balance,
  };

  if (JSON.stringify(prevEmit) === JSON.stringify(toEmit)) {
    return;
  }

  debug('%o', toEmit);
  socket.emit('move', toEmit);
  prevEmit = toEmit;
}

[
  'lshoulder',
  'rshoulder',
].forEach((shoulder) => {
  controller[shoulder].on('press', () => {
    if (shoulder === 'lshoulder') {
      socket.emit('move', 'left');
    } else {
      socket.emit('move', 'right');
    }

    turnLeftRight = true;
  });

  controller[shoulder].on('release', () => {
    turnLeftRight = undefined;
    prevEmit = {};
  });
});

[
  'ltrigger',
  'rtrigger',
].forEach((trigger) => {
  controller[trigger].on('move', (event) => {
    if (event.delta === 0) {
      return;
    }

    let value = event.normval;
    value *= 10;
    value = Math.round(value);
    value *= 10;
    value = Math.min(value, 100);
    value = Math.max(value, 0);

    if (trigger === 'ltrigger') {
      direction = 1;
    } else {
      direction = 2;
    }

    speed = value;
  });
});

controller.rpad.on('move', (event) => {
  socket.emit('headset position', `{"horizontal": ${event.normx}, "vertical": ${event.normy}}`);
});

controller.stick.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normx;
  value *= 10;
  value = Math.round(value);
  value *= 10;
  value = Math.min(value, 100);
  value = Math.max(value, -100);

  balance = value;
});

setInterval(emit, 5);

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
