
var koa = require('koa');
var http = require('http');
var serve = require('koa-static');
var Router = require('koa-route');
var xml2json = require('xml2json');
var session = require('koa-session');
var Agency = require('./lib/agency');
var socket = require('./lib/socket');
var emitter = require('./lib/emitter');
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
    console.error('Could not parse agencies', e.stack, e.message);
    return;
  }

  var server = http
    .createServer(app.callback())
    .listen(port);

  primus = socket(server);

  debug('Listening on %d', port);
}

function registerEvents() {
  primus.on('connection', function (spark) {
    spark.on('disconnect', function () {
      debug('Client disconnected', spark.id);
    });

    spark.on('register:stop', function (payload) {
      debug('Register stop event');
      payload = payload || {};
      
      if (!payload.agency) {
        // Kill spark connection to server
        console.error('No agency tag in payload');
        return;
      }
      
      var event = 'agency:' +
        payload.agency +
        ':stop:' +
        payload.stop;
      debug(event, 'emitting');
      emitter.emit(event, spark);
    });

  });
}