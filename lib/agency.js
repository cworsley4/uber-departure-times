
var co = require('co');
var nextbus = require('./apis/nextbus');
var debug = require('debug')('uber:agency');

function Agency (attributes) {
  this.routes = {};
  this.tag = attributes.tag;
  this.title = attributes.title;
  this.regionTitle = attributes.regionTitle;
}

Agency.prototype.routes = function () {
  var self = this;

  if (this.routes) {
    debug('Already have routes, no need to collect again');
    return;
  }

  co(function *() {
    self.routes = yield nextbus.routes(self.tag);
    debug('Got the routes', self.routes);
  });
};

Agency.prototype.add = function (spark) {

  spark.on('register:route', function (payload) {

  });

};

module.exports = Agency;
