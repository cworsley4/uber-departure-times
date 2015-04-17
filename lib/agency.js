
var co = require('co');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Agency (attributes) {
  this.routes = {};
  this.title = attributes.title;
  this.tag = this.agency = attributes.tag;
  this.regionTitle = attributes.regionTitle;
}

// Checking
Agency.prototype.populateRoute = function (routeId) {
  var self = this;

  this.routes = this.routes || {};
  var route = this.routes[routeId] || {};

  debug(route, route.hydrated);

  if (this.routes[routeId] && route.hydrated) {
    return new Promise(function (resolve, reject) {
      resolve(route);
    });
  }

  return nextbus
    .stops(this.agency, routeId)
    .then(function (res) {
      var routeConfig = xml2json.toJson(res.text);
      try {
        routeConfig = JSON.parse(routeConfig).body;
      } catch (e) {
        console.error('Could not parse stops reponse', e.stack);
        return;
      }

      route.stops = [];
      for (var i = 0; i < routeConfig.route.stop.length; i++) {
        route.stops.push({
          agencyId: self.agencyId,
          routeId: routeId,
          stopId: routeConfig.route.stop[i].tag,
          stop: routeConfig.route.stop[i]
        });
        route.hydrated = true;
      }

      route.path = routeConfig.route.path;
      route.direction = routeConfig.route.direction;
      
      return route;
    });
};

// Checkmark!
Agency.prototype.getRoutes = function () {
  var self = this;

  debug('Checking for routes', this.routes);

  if (this.routes && Object.keys(this.routes).length) {
    debug('Already have routes, no need to collect again');
    return new Promise(function (resolve, reject) {
      resolve(self.routes);
    });
  }

  return nextbus
    .routes(self.tag)
    .then(function (response) {
      var routes = xml2json.toJson(response.text);
      try {
        routes = JSON.parse(routes).body.route;
      } catch (e) {
        console.error(e.stack, e.message);
        return;
      }

      self.routes = self.routes || {};
      for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        route.hydrated = false;
        self.routes[routes[i].tag] = route;
      }

      return self.routes;
    });
};

module.exports = Agency;
