
var common = require('./common');
var debug = require('debug')('uber:nextbus:agency-routes');

module.exports = function (agency, route) {
  debug('Getting stops for route: %s', route);
  return common.request('routeConfig', {
    a: agency,
    r: route
  });
};
