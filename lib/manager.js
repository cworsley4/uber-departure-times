
var Worker = require('./worker');
var debug = require('debug')('uber:manager');

/**
 * Manager keeps track of workers, so it can later run, 
 * and destroy them.
 */
function Manager() {
  this.workers = {};
}

/**
 * Remove a worker from service to stop api calls
 * typically used with there are no more clients listening
 * 
 * @param  {string} room [room of subscribers]
 * @return {void}
 */
Manager.prototype.reap = function (room) {
  debug('Reaping worker, room: %s', room);
  this.workers[room].halt();
};

/**
 * Start worker, but make sure only one runs at a time
 * per agency stop
 * 
 * @param  {string} event   [event and worker identifier]
 * @param  {[type]} payload [payload, detals to boot worker with]
 * @return {[Worker]}
 */
Manager.prototype.spawn = function (event, payload) {
  debug('Spawning worker for event: ', event);
  var worker = this.workers[event];

  // Do we already have a worker?
  if (!worker) {
    worker = new Worker(event, payload);
    this.workers[event] = worker;
  }

  // If its not running, start it up!! Room... ROOOMMMMMM...
  if (!worker.interval) {
    worker.run();
  }
  
  // Return instance
  return worker;
};

module.exports = Manager;
