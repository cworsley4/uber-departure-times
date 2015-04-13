
var Router = require('koa-routes');

var route = new Router();

var agency = function *(next) {
  yield next;
  
};

route.get('agency');
route.set('agency');

module.exports = route;
