const io = require('socket.io')();
const SteamController = require('./Controller');

const controller = new SteamController();

let speed = 0;
let direction = 2;
let balance = 0;

let loopTurnLeft;
let loopTurnRight;

function turnLeft() {
  io.sockets.emit('move', 'left');
}

function turnRight() {
  io.sockets.emit('move', 'right');
}

let prevEmit = {
  speed,
  direction,
  balance,
};

function emit() {
  if (loopTurnLeft !== undefined || loopTurnRight !== undefined) {
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

  io.sockets.emit('move', toEmit);
  prevEmit = toEmit;
}

controller.lshoulder.on('press', () => {
  loopTurnLeft = setInterval(turnLeft, 1);
});

controller.lshoulder.on('release', () => {
  clearInterval(loopTurnLeft);
  loopTurnLeft = undefined;
  prevEmit = {};
});

controller.rshoulder.on('press', () => {
  loopTurnRight = setInterval(turnRight, 1);
});

controller.rshoulder.on('release', () => {
  clearInterval(loopTurnRight);
  loopTurnRight = undefined;
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

controller.y.on('press', () => {
  speed = 0;
  direction = 2;
  balance = 0;
});

io.listen(3000);
controller.connect();
setInterval(emit, 1);
