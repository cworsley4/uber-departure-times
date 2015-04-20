
var Manager = require('./manager');
var emitter = require('./emitter');
var debug = require('debug')('uber:socket');

module.exports = function (primus) {
  var self = this;
  var manager = new Manager();
  debug('Registering events');

  // Client connection listener
  primus.on('connection', function (spark) {
    debug('Connected to the socket server');

    // Client requests to be registered for all data pertaining
    // to the stop identified in the paylaod
    spark.on('subscribe:stop', function (payload) {
      debug('Register stop event');
      payload = payload || {};
      
      // Confirm the payload's validity
      if (!payload.agency || !payload.route || !payload.stop) {
        console.error('Insuffecient payload', payload);
        return;
      }

      var event = 'agency:' +
        payload.agency +
        ':stop:' +
        payload.stop;

      var update = event + ':' + 'update';

      // Ensure that a client can only recieve updates from one stop
      spark.leaveAll(function () {
        debug(spark.id + ' left the rooms ', arguments);

        // Join the target room
        spark.join(event, function () {
          debug(spark.id + ' joined the room: ', event);
        });

        // Spawn worker
        manager.spawn(event, payload);
      });

      // Make sure there is only one listener for the update event
      // to prevent duplicate events being emitted to clients
      emitter.removeAllListeners(update);
      // Add emitter for worker updates
      emitter.on(update, function (data) {
        try {
          debug('Heard update on %s', event);
          primus.room(event).clients(function (err, clients) {
            debug('Clients in room %s', event, clients);

            // There there are people in the room then send
            // the data down. Otherwise, retire the worker
            // from service
            if (clients.length) {
              primus.room(event).send(event, data);
              return;
            }

            // Remove worker
            manager.reap(event);
          });
        } catch (e) {
          console.error(e.message, e.stack);
        }
      });
    });

  });
};
