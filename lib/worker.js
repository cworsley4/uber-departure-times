
var xml2json = require('xml2json');
var emitter = require('./emitter');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:worker');

/**
 * Constructor
 * @param {string} event   event to emit updates on
 * @param {[type]} details details of event
 */
function Worker (event, details) {
  this.event = event;
  this.details = details;
  this.sparks = [];

  debug('Starting up worker: %s', event, details);

  // Set interval but keep up with the ID of iteration so
  // we can remove/clear it on destroy
  this.interval = setInterval(this.run.bind(this), 2000);
}

/**
 * Stop the worker! No more api calls or events emitted
 * @return {void}
 */
Worker.prototype.halt = function () {
  clearInterval(this.interval);
};

/**
 * Run Forest, RUN! this is the method that executes the 
 * API call out to the target api. Once it recieves a response
 * it will emitted it and the lister will push down to all socket clients
 * that are subscribed to said event.
 * 
 * @return {void}
 */
Worker.prototype.run = function () {
  var self = this;

  // Execute the prediction request, without cache
  nextbus
    .predictions(
      this.details.agency,
      this.details.route,
      this.details.stop
    )
    .cache(false) // No cache here!!
    .exec()
    .then(function (res) {
      try {
        debug('Got a result from the API call');
        var data = xml2json.toJson(res.text); // Convert to json
        emitter.emit(self.event + ':update', data); // Emit update
      } catch (e) {
        console.error(e.message, e.stack);
        return;
      }
    });
};

module.exports = Worker;
