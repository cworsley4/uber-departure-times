
var request = require('superagent-promise');
var debug = require('debug')('uber:nextbus:common');
var config = require('envcfg')(__dirname + '/../../../config/api.json');

module.exports = function (command, query) {
  if (!command) {
    console.error('No command included, bailing on NextBus API call');
    return;
  }

  if (typeof query !== 'object') {
    debug('No query supplied');
    query = {};
  }

  debug('Executing NextBus API call to %s', command);

  return request.get(config.nextbus)
    .set('Accept', 'application/xml')
    .query({ command: command })
    .query(query)
    .end();
};
