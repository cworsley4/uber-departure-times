
var common = require('./common');
var debug = require('debug')('uber:nextbus:agency-routes');

module.exports = function (agency) {
  debug('Getting routes for agency: %s', agency);
  return common.request('routeList', {
    a: agency
  });
};
