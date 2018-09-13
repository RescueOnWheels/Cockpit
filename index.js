const io = require('socket.io')();
const SteamController = require('./Controller');

const controller = new SteamController();

let speed = 0;
let direction = 1;
let balance = 0;

let loopTurnLeft;
let loopTurnRight;

function turnLeft() {
  io.sockets.emit('move', 'left');
}

function turnRight() {
  io.sockets.emit('move', 'right');
}


function emit() {
  if (loopTurnLeft !== undefined || loopTurnRight !== undefined) {
    return;
  }

  io.sockets.emit('move', { speed, direction, balance });
}

controller.lshoulder.on('press', () => {
  loopTurnLeft = setInterval(turnLeft, 1);
});

controller.lshoulder.on('release', () => {
  clearInterval(loopTurnLeft);
  loopTurnLeft = undefined;
});

controller.rshoulder.on('press', () => {
  loopTurnRight = setInterval(turnRight, 1);
});

controller.rshoulder.on('release', () => {
  clearInterval(loopTurnRight);
  loopTurnRight = undefined;
});

controller.ltrigger.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normval;
  value *= -100;
  value = Math.round(value);

  direction = -1;
  speed = value;
});

controller.rtrigger.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normval;
  value *= 100;
  value = Math.round(value);

  direction = 1;
  speed = value;
});

controller.stick.on('move', (event) => {
  if (event.delta === 0) {
    return;
  }

  let value = event.normx;
  value *= 100;
  value = Math.round(value);

  balance = value;
});

controller.y.on('press', () => {
  speed = 0;
  direction = 1;
  balance = 0;
});


io.listen(3000);
controller.connect();
setInterval(emit, 1);
