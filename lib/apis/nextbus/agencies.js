
var common = require('./common');
var request = require('superagent-promise');
var debug = require('debug')('uber:nextbus:agencies');

module.exports = function () {
  return common('agencyList');
};
