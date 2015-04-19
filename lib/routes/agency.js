
var Router = require('koa-router')();

module.exports = function (agencies) {
  return Router.get('/agencies', function *(next) {
    this.body = agencies;
    yield next;
  });
};
