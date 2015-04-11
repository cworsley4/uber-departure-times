
var co = require('co');
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
  
  spark.on('register:route', function (payload) {
    if (!payload.route) {
      debug('Cannot add to room without a route name');
      return;
    }
    
    var room = self.agency + ':' + payload.route;
    debug('Spark %s joining room %s', spark.id, room);
    spark.join(room, function () {
      var route = self.routes[payload.route];
      if (route && !route.hydrated) {
        nextbus.stops(self.agency, payload.route).then(function (res) {
          var stops = xml2json.toJson(res.text);
          try {
            stops = JSON.parse(stops).body;
            if (stops.error) {
              throw Error('API returned an error, check yo self!');
            }

            route = stops.route;
            route.hydrated = true;
          } catch (e) {
            console.error(e);
            return;
          }
        });
      }
    });
  });

};

module.exports = Agency;
