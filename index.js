var SteamController = require('./Controller');
var controller = new SteamController();

var speed = 0;
var direction = 1;
var balance = 0;

var loopTurnLeft, loopTurnRight;
const loopInterval = 1;

controller.lshoulder.on('press', () => {
    loopTurnLeft = setInterval(turnLeft, loopInterval);
});

controller.lshoulder.on('release', () => {
    clearInterval(loopTurnLeft);
    loopTurnLeft = undefined;
});

controller.rshoulder.on('press', () => {
    loopTurnRight = setInterval(turnRight, loopInterval);
});

controller.rshoulder.on('release', () => {
    clearInterval(loopTurnRight);
    loopTurnRight = undefined;
});

controller.ltrigger.on('move', (event) => {
    if (event.delta == 0) {
        return;
    }

    var value = event.normval;
    value *= -100;
    value = Math.round(value);

    direction = -1;
    speed = value;
});

controller.rtrigger.on('move', (event) => {
    if (event.delta == 0) {
        return;
    }

    var value = event.normval;
    value *= 100;
    value = Math.round(value);

    direction = 1;
    speed = value;
});

controller.stick.on('move', (event) => {
    if (event.delta == 0) {
        return;
    }

    var value = event.normx;
    value *= 100;
    value = Math.round(value);

    balance = value;
});

controller.y.on('press', () => {
    speed = 0;
    direction = 1;
    balance = 0;
});

var io = require('socket.io')();
io.listen(3000);

function turnLeft() {
    io.sockets.emit('move', 'left');
}

function turnRight() {
    io.sockets.emit('move', 'right');
}

function emit() {
    if (loopTurnLeft != undefined || loopTurnRight != undefined) {
        return;
    }

    io.sockets.emit('move', { speed, direction, balance });
}

controller.connect();
setInterval(emit, 1);