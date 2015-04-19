
var xml2json = require('xml2json');
var emitter = require('./emitter');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:worker');

function Worker (event, details) {
  this.event = event;
  this.details = details;
  this.sparks = [];

  debug('Starting up worker: %s', event, details);
  this.interval = setInterval(this.run.bind(this), 2000);
}

Worker.prototype.halt = function () {
  clearInterval(this.interval);
};

Worker.prototype.run = function () {
  var self = this;

  // Execute the prediction request, without cache
  nextbus
    .predictions(
      this.details.agency,
      this.details.route,
      this.details.stop
    )
    .cache(false)
    .exec()
    .then(function (res) {
      try {
        debug('Got a result from the API call');
        var data = xml2json.toJson(res.text);
        debug(data, data.body);
        emitter.emit(self.event + ':update', data);
      } catch (e) {
        console.error(e.message, e.stack);
        return;
      }
    });
};

module.exports = Worker;
