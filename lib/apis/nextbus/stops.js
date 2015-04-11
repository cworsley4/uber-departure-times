
var common = require('./common');
var debug = require('debug')('uber:nextbus:agency-routes');

module.exports = function (agency, route) {
  debug('Getting stops for route: %s', route);
  return common('routeConfig', {
    a: agency,
    r: route
  });
};
