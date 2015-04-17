
var emitter = require('./emitter');
var nextbus = require('./apis/nextbus');

function Worker (event, details) {
  this.event = event;
  this.details = details;
  this.running = false;
  this.sparks = [];
}

Worker.prototype.run = function () {
  var self = this;
  this.running = true;

  nextbus
    .predictions({
      a: this.details.agency,
      r: this.details.route,
      s: this.details.stop
    })
    .then(function (result) {
      emitter.emit(self.event, result, function () {
        self.run();
      });
    });
};
