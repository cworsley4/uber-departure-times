
var socket = require('./socket');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Stop (agency, routeId, stop) {
  this.agency = agency;
  this.routeId = routeId;
  this.stopId = stopId;
}

Stop.prototype.add = function (spark) {
  var self = this;
  var room = this.agency + ':' + this.routeId + ':' + this.stopId;
  debug('Spark %s is joining room %s', spark.id, room);
  spark.join(room, function () {
    
  });
};

Stop.prototype.ticker = function () {
  var self = this;
  this.timer = setInterval(function () {
    nextbus
      .predictions(self.agency, self.routeId, self)
      .then();
  }, 4000);
};

module.exports = Stop;
