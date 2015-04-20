
var koa = require('koa');
var http = require('http');
var Router = require('koa-route');
var serve = require('koa-static');
var xml2json = require('xml2json');
var session = require('koa-session');
var Agency = require('./lib/agency');
var socket = require('./lib/primus');
var emitter = require('./lib/emitter');
var Manager = require('./lib/manager');
var debug = require('debug')('uber:main');
var request = require('superagent-promise');
var nextbus = require('./lib/apis/nextbus');
var config = require('envcfg')(__dirname + '/config/api.json');

var primus;
var agencies;
var port = process.env.PORT || 3000;
var routes = require('./lib/routes');

var app = koa();
app.keys = ['hire Cecil Worsley :)'];

// Bootstrap koa app
app.use(session(app));
app.use(serve('./public'));

// koa app routes
app.use(
  Router.get('/agencies', function *() {
    this.body = agencies;
  })
);

app.use(
  Router.get('/routes/:aid', function *(agencyId) {
    this.body = yield agencies[agencyId].getRoutes();
  })
);

app.use(
  Router.get('/stops/:aid/:rid', function *(agencyId, routeId) {
    this.body = yield agencies[agencyId].populateRoute(routeId);
  })
);

// Initialize server and events
nextbus
  .agencies()
  .exec()
  .then(bootstrap)
  .then(registerEvents);

// Get the list of agencies
// Limiting in the long run, see README.md
function bootstrap(res) {
  try {
    var tempAgencies = {};
    agencies = JSON.parse(xml2json.toJson(res.text));
    agencies = agencies.body.agency;
    
    // Create new agency for each
    for (var i = 0; i < agencies.length; i++) {
      tempAgencies[agencies[i].tag] = new Agency(agencies[i]);
    }
    
    agencies = tempAgencies;
  } catch (e) {
    console.error('Could not parse agencies', e.message);
    return;
  }

  // Boot http server, attach the koa app and bind to port
  var server = http
    .createServer(app.callback())
    .listen(port);

  // Bind the socket library to the http server
  primus = socket(server);

  debug('Listening on %d', port);
}

function registerEvents() {
  var self = this;
  var manager = new Manager();
  debug('Registering events');

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

}