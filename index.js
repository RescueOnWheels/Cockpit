const DEBUG = false;

/* Start of program */

const socket = require('socket.io-client')('http://127.0.0.1:3000');
const SteamController = require('./Controller');

const controller = new SteamController();

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
    value *= 255;
    value /= 16;
    value = Math.round(value);
    value *= 16;
    value = Math.min(value, 255);

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
controller.connect();
