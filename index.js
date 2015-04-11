
var koa = require('koa');
var http = require('http');
var Primus = require('primus');
var serve = require('koa-static');
var xml2json = require('xml2json');
var session = require('koa-session');
var debug = require('debug')('uber:main');
var request = require('superagent-promise');
var nextbus = require('./lib/apis/nextbus');
var PrimusEmitter = require('primus-emitter');
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


// Initialize server
nextbus
  .agencies()
  .then(function (res) {
    try {
      var tempAgencies = {};
      agencies = JSON.parse(xml2json.toJson(res.text));
      agencies = agencies.body.agency;
      for (var i = 0; i < agencies.length; i++) {
        // tempAgencies[agencies[i].tag] = new Agency(agencies[i]);
      }
      agencies = tempAgencies;
    } catch (e) {
      console.error('Could not parse agencies', e);
      process.kill();
    }

    var server = http
      .createServer(app.callback())
      .listen(port);

    debug('Listening on %d', port);

    primus = new Primus(server, {
      transformer: 'engine.io'
    });
    primus.use('emitter', PrimusEmitter);

    registerEvents();
  });

function registerEvents() {
  primus.on('connection', function (spark) {
    spark.on('register', function (payload) {
      var agency = agencies[payload.agency];
      if (!agency) {
        console.error('Agency \'%s\' not found, cannot register',
          payload.agency);
        return;
      }

      agency.add(spark);
    });

    spark.on('disconnect', function (payload) {
      var agency = agencies[payload.agency];
      if (!agency) {
        console.error('Agency \'%s\' not found, cannot unregister',
          payload.agency);
        return;
      }

      agency.remove(spark);
    });
  });
}