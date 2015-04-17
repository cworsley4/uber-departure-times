
var Worker = require('./worker');

function Manager(Primus) {
  this.workers = {};
}

Manager.prototype.reap = function (room) {
  this.workers[room].stop();
  delete this.workers[room];
};

Manager.prototype.spawn = function (event, payload) {
  var worker = this.workers[event];

  if (!worker) {
    worker = new Worker(event, payload);
    this.workers[event] = worker;
    return worker;
  }

  return worker;
};
