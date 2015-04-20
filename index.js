
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
var sockets = require('./lib/sockets');
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
  .then(sockets);

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
