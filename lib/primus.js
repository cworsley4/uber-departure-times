// Primus singleton

var Primus = require('primus');
var PrimusRooms = require('primus-rooms');
var debug = require('debug')('uber:primus');
var PrimusEmitter = require('primus-emitter');

var primus;

module.exports = function (server) {
  if (primus) {
    debug('Returning singleton instance');
    return primus;
  }
  
  primus = new Primus(server, {
    transformer: 'engine.io'
  });

  // Very important
  primus.use('emitter', PrimusEmitter);
  primus.use('rooms', PrimusRooms);

  return primus;
};
