
var emitter = require('./emitter');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:stop');

function Stop (agencyId, routeId, stop) {
  this.stop = stop;
  this.predictions = {};
  this.routeId = routeId;
  this.stopId = stop.tag;
  this.agencyId = agencyId;
  this.eventName = 'agency:' + this.agencyId + ':stop:' + this.stopId;
  this.eventListeners();
}

Stop.prototype.eventListeners = function () {
  var self = this;
  debug('Creating listeners for', this.eventName); 

  emitter.on(self.eventName, function (spark) {
    var room = 'agency:' + self.agencyId + ':stop:' + self.stopId;
    debug('%s Joining room', spark.id);
    spark.join(room, function () {
      debug('Sending arrival predictions to joined user', spark.id);
      nextbus
        .predictions(self.agency, self.routeId, self.stopId)
        .then(function () {
          debug('Emitting data to room %s', room);
        });
    });
  });

};

Stop.prototype.ticker = function () {
  var self = this;
  this.timer = setInterval(function () {

  }, 4000);
};

module.exports = Stop;
