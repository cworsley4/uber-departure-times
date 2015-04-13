
var primus = require('./socket');
var emitter = require('./emitter');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Stop (agencyId, routeId, stopId) {
  this.agencyId = agencyId;
  this.routeId = routeId;
  this.stopId = stopId;
  this.predictions = {};
  this.eventName = 'agency:' + this.agency + ':stop:' + this.stopId;
  this.eventListeners();
  // this.ticker();
}

Stop.prototype.eventListeners = function (spark) {
  var self = this;

  debug('Creating listeners for', this.eventName); 

  emitter.on('register:' + self.eventName, function () {
    debug('%s Joining room', spark.id);
    spark.join(self.eventName, function () {
      debug('Sending arrival predictions to joined user', spark.id);
      spark.send('stop:arrivals', self.predictions);
    });
  });

  // emitter.on('unregister:' + self.eventName, function () {
  //   primus.roomIsEmpty(self.eventName, function () {
  //     if (self.timer) {

  //     }
  //   });
  // });

  var room = this.agency + ':' + this.routeId + ':' + this.stopId;
  debug('Spark %s is joining room %s', spark.id, room);
};

Stop.prototype.ticker = function () {
  var self = this;
  this.timer = setInterval(function () {
    nextbus
      .predictions(self.agency, self.routeId, self)
      .then(function () {

      });
  }, 4000);
};

module.exports = Stop;
