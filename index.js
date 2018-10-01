const DEBUG = false;

/* Start of program */

const socket = require('socket.io-client')('http://192.168.43.85:3000');
const controller = require('./Controller');

const self = this;
let token = '';

socket.on('connect', () => {
  console.info('Connected');
});

socket.on('heartbeat', () => {
  if (DEBUG) console.info('beat');

  socket.emit('heartbeat');
});

socket.on('authenticate', (cb) => {
  if (token.length === 4 && self.call !== undefined) {
    cb(token);
    return;
  }

  console.info('Enter the authorization code:');
  self.call = cb;
});

socket.on('authenticated', () => {
  console.info('Authorization successful!');
});

socket.on('disconnect', (reason) => {
  /**
   * Invalid authorization token provided.
   * The Rover disconnected us, manual re-connect required.
   */
  if (reason === 'io server disconnect') {
    token = '';
    socket.connect();
  }

  console.info('Disconnected');
  console.warn();
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
 *
 * @function
 * @returns {undefined}
 */
function emit() {
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
    value *= 1023;
    value /= 16;
    value = Math.round(value);
    value *= 16;
    value = Math.min(value, 1023);
    value = Math.max(value, 0);

    if (trigger === 'ltrigger') {
      direction = 1;
    } else {
      direction = 2;
    }

    speed = value;
  });
});

controller.stick.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normx;
  value *= 255;
  value = Math.round(value);

  balance = value;
});

setInterval(emit, 1);

/**
 * Connect to the Steam Controller.
 * This is a work-around for the `error` event of the controller,
 * as we can't re-connect properly inside the `on` scope.
 *
 * @function
 * @returns {undefined}
 */
function connect() {
  controller.connect();
}

controller.on('error', (err) => {
  socket.emit('controller disconnect');
  /**
   * Error code 404 is only thrown if the Steam Controller is not found;
   * Ignoring the error message because we know what it will be.
   */
  if (err.code !== 404) {
    console.error(err);
  }

  /**
   * Attempt re-connecting to the Steam Controller.
   */
  setTimeout(connect, 1000);
});

/**
 * Graceful shutdown of HID.
 */
process.on('SIGINT', () => {
  controller.disconnect();
  socket.disconnect();
});

connect();

