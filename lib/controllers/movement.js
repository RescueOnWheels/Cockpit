/* Debug */
const debug = require('debug')('RRS:Cockpit');

/**
 * Interval, in miliseconds, to check if a new command has to be send.
 */
const EMIT_INTERVAL = 5;

module.exports = (socket, controller) => {
  let speed = 0;
  let direction = 2;
  let balance = 0;

  let turnLeftRight;

  let prevEmit = {
    speed,
    direction,
    balance,
  };

  controller.y.on('press', () => {
    if (socket.token.length < 4) {
      return;
    }

    speed = 0;
    direction = 2;
    balance = 0;

    const toEmit = {
      speed,
      direction,
      balance,
    };

    if (JSON.stringify(prevEmit) === JSON.stringify(toEmit)) {
      return;
    }

    socket.emit('move', toEmit);
  });

  /**
     * Emits a 'move' event with the `speed`, `direction` and `balance`;
     * This doesn't emit if the previous emit containted the same data.
     */
  function emit() {
    if (!socket.connected) {
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

    if ((prevEmit.speed === 0 && toEmit.speed === 0)) {
      return;
    }

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
    socket.emit('headset position', `{"horizontal": ${-1 * event.normx}, "vertical": ${event.normy}}`);
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

  setInterval(emit.bind(this), EMIT_INTERVAL);

  return socket;
};
