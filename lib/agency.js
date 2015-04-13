
var co = require('co');
var Stop = require('./stop');
var socket = require('./socket');
var xml2json = require('xml2json');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Agency (attributes) {
  this.routes = undefined;
  this.title = attributes.title;
  this.tag = this.agency = attributes.tag;
  this.regionTitle = attributes.regionTitle;
}

Agency.prototype.populateRoute = function (routeId) {
  var self = this;
  var route = this.routes[routeId] || {};

  debug('Getting stops by Route', route);

  if (route && route.stop) {
    return new Promise(function (resolve, reject) {
      resolve(route);
    });
  }

  return nextbus
    .stops(this.tag, routeId)
    .then(function (res) {
      var routeConfig = xml2json.toJson(res.text);

      try {
        routeConfig = JSON.parse(routeConfig).body.route;
      } catch (e) {
        return console.error('Could not parse stops reponse', e.stack);
      }

      route.path = routeConfig.path;
      route.stop = routeConfig.stop;
      route.direction = routeConfig.direction;

      debug('Returning route stops', route);
      return route;
    });
};

Agency.prototype.getRoutes = function () {
  var self = this;

  debug('Checking for routes', this.routes);

  if (this.routes) {
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
        self.routes[routes[i].tag] = routes[i];
      }

      return self.routes;
    });
};

module.exports = Agency;
