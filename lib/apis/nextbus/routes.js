
var common = require('./routes');
var debug = require('debug')('uber:nextbus:agency-routes');

module.exports = function (agency) {
  return common('routeList', {
    a: agency
  });
};
