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
  if (token.length === 4) {
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
    if (token.length === 4) {
      return;
    }

    token += button.toUpperCase();

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

  speed = 0;
  direction = 2;
  balance = 0;
});

let turnLeftRight;

function turnLeft() {
  socket.emit('move', 'left');
}

function turnRight() {
  socket.emit('move', 'right');
}

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

controller.lshoulder.on('press', () => {
  turnLeft();
  turnLeftRight = true;
});

controller.lshoulder.on('release', () => {
  turnLeftRight = undefined;
  prevEmit = {};
});

controller.rshoulder.on('press', () => {
  turnRight();
  turnLeftRight = true;
});

controller.rshoulder.on('release', () => {
  turnLeftRight = undefined;
  prevEmit = {};
});

controller.ltrigger.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normval;
  value *= 255;
  value /= 16;
  value = Math.round(value);
  value *= 16;
  value = Math.min(value, 255);

  direction = 1;
  speed = value;
});

controller.rtrigger.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normval;
  value *= 255;
  value /= 16;
  value = Math.round(value);
  value *= 16;
  value = Math.min(value, 255);

  direction = 2;
  speed = value;
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
