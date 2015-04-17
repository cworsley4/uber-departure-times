
var Worker = require('./worker');
var debug = require('debug')('uber:manager');

function Manager() {
  this.workers = {};
}


Manager.prototype.reap = function (room) {
  debug('Reaping worker, room: %s', room);
  this.workers[room].halt();
};

Manager.prototype.spawn = function (event, payload) {
  debug('Spawning worker for event: ', event);
  var worker = this.workers[event];

  if (!worker) {
    worker = new Worker(event, payload);
    this.workers[event] = worker;
  }

  if (!worker.interval) {
    worker.run();
  }
  
  return worker;
};

module.exports = Manager;
