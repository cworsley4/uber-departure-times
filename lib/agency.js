
var co = require('co');
var Stop = require('./stop');
var socket = require('./socket');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Agency (attributes) {
  this.routes = {};
  this.tag = this.agency = attributes.tag;
  this.title = attributes.title;
  this.regionTitle = attributes.regionTitle;
}

Agency.prototype.checkRoutes = function () {
  var self = this;

  debug('Checking for routes', this.routes, Object.keys(this.routes).length);

  if (Object.keys(this.routes).length > 0) {
    debug('Already have routes, no need to collect again');
    return;
  }

  nextbus
    .routes(self.tag)
    .then(function (response) {
      var routes = xml2json.toJson(response.text);
      try {
        routes = JSON.parse(routes).body.route;
        for (var i = 0; i < routes.length; i++) {
          self.routes[routes[i].tag] = routes[i];
        }
      } catch (e) {
        console.error(e);
        return;
      }
    });
};

Agency.prototype.add = function (spark) {
  var self = this;
  this.checkRoutes();
  var registerEventName = this.tag + ':register:route';
  
  spark.on(registerEventName, function (payload) {
    payload = payload || {};
    if (!payload.route) {
      debug('Cannot add to room without a route name');
      return;
    }

    var routeId = payload.route;
    var route = self.routes[routeId];
    var stops = route.stops || {};

    if (Object.keys(route.stops).length) {
      nextbus.stops(self.agency, self.routeId).then(function (res) {
        try {
          var stops = xml2json.toJson(res.text);
          var route = self.routes[routeId];

          stops = JSON.parse(stops).body;
          if (stops.error) {
            throw Error('API returned an error, check yo self!');
          }

          spark.send('route:' + routeId + ':stops', stops);

          // Create a stop object for each stop
          for (var i = 0; i < stops.length; i++) {
            var stop = stops[i];
            debug('Creating new stop', stop.tag);
            stop = new Stop(self.agency, routeId, stop);
            route.stops.push(stop);
          }
        } catch (e) {
          console.error(e);
          return;
        }
      });
    }

    route.add(spark);
  });

};

module.exports = Agency;
