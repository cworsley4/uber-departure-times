
UberApp.service('primusService', function ($rootScope, $log, primus) {
  primus.$on('data', function () {
    $log.info('Data', arguments);
  });
});
