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
});

controller.rshoulder.on('press', () => {
    loopTurnRight = setInterval(turnRight, loopInterval);
});

controller.rshoulder.on('release', () => {
    clearInterval(loopTurnRight);
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

controller.a.on('press', () => {
    // TODO: Trigger boost modus
});

controller.y.on('press', () => {
    speed = 0;
    direction = 1;
    balance = 0;
});

function turnLeft() {
    // TODO: Trigger on spot left turn
}

function turnRight() {
    // TODO: Trigger on spot right turn
}

function emit() {
    // TODO: Build object from data and emit to Rover

    console.log({ speed, direction, balance });

}

controller.connect();
setInterval(emit, 1);