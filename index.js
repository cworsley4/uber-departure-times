
var koa = require('koa');
var http = require('http');
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
  .then(bootstrap)
  .then(registerEvents);

function bootstrap(res) {
  try {
    var tempAgencies = {};
    agencies = JSON.parse(xml2json.toJson(res.text));
    agencies = agencies.body.agency;
    
    for (var i = 0; i < agencies.length; i++) {
      tempAgencies[agencies[i].tag] = new Agency(agencies[i]);
    }
    
    agencies = tempAgencies;
  } catch (e) {
    console.error('Could not parse agencies', e.message);
    return;
  }

  var server = http
    .createServer(app.callback())
    .listen(port);

  primus = socket(server);

  debug('Listening on %d', port);
}

function registerEvents() {
  debug('Registering events');
  var manager = new Manager();

  primus.on('leaveroom', function (room, spark) {
    var clients = primus.room(room).clients();
    if (!clients.length) {
      // Kill the worker
      manager.reap(room);
    }
  });

  primus.on('connection', function (spark) {
    debug('Connected to the socket server');

    // Routes
    

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
      spark.leaveAll();
      // Join primus room
      spark.join(spark, event);

      // Make sure there is only one listener for the update event
      // to prevent duplicate events being emitted to clients
      emitter.removeAllListeners(update);
      // Add emitter for worker updates
      emitter.on(update, function () {
        if (primus.room)
        primus.room(event).write(['hiya', payload]);
      });

      // Spawn worker
      manager.spawn(event, payload);
    });

  });
}