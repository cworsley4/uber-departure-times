
var common = require('./common');
var debug = require('debug')('uber:nextbus:agency-routes');

module.exports = function (agency, route, stop) {
  debug('Getting predictions for route: %s', route);
  return common('predictions', {
    a: agency,
    r: route,
    s: stop
  });
};
