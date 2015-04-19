
UberApp.controller('MainController', function (
  $scope,
  $http,
  $window,
  $log,
  ipCookie,
  primus
) {

  var targetEvent;
  var subscriptionData;
  var firstPredictions;

  $scope.step = 1;
  $scope.stops = {};
  $scope.chosen = {};
  $scope.routes = {};
  $scope.agencies = {};

  primus.$on('reconnect', function () {
    if (subscriptionData) {
      primus.send('subscribe:stop', subscriptionData);
    }
  });

  function subscribe () {
    $log.info('Subscribing', targetEvent, 'with', subscriptionData);
    $scope.loading = true;
    primus.send('subscribe:stop', subscriptionData);

    primus.$on(targetEvent, function (data) {
      var result = JSON.parse(data);
      var predictions = result || {};

      if (result.body.Error) {
        // Display flash message
        $log.error('Bad data', predictions.Error);
        return;
      }

      predictions = predictions.body || {};
      predictions = predictions.predictions || {};
      
      // Correcting for when api changes data types from an array of objects to
      // just a single object
      if (predictions.direction && typeof predictions.direction !== 'array') {
        $log.info('Fixing api data types');
        var direction = predictions.direction;
        predictions.direction = [];
        predictions.direction.push(direction);
      }

      $scope.predictions = predictions;
      $scope.loading = false;
    });
  }

  $scope.back = function () {
    if ($scope.step > 1) {
      $scope.step--;
    }
  };

  $scope.selectAgency = function (agency) {
    $http
      .get('/routes/' + agency.tag)
      .success(function (routes) {
        $scope.step = 2;
        $scope.chosen.agency = agency;
        $scope.routes = routes;
      });
  };

  $scope.selectRoute = function (route) {
    var agency = $scope.chosen.agency;
    $http
      .get('/stops/' + agency.tag + '/' + route.tag)
      .success(function (stops) {
        $log.info(stops);
        $scope.step = 3;
        $scope.stops = stops;
        $scope.chosen.route = route;
      });
  };

  $scope.selectStop = function (stop) {
    $scope.chosen.stop = stop;
    firstPredictions = undefined;
    var chosen = $scope.chosen;
    ipCookie('agency', chosen.agency);
    ipCookie('route', chosen.route);
    ipCookie('stop', chosen.stop);

    subscriptionData = {
      agency: chosen.agency.tag,
      route: chosen.route.tag,
      stop: chosen.stop.stop.tag
    };

    targetEvent = 'agency:' +
      chosen.agency.tag +
      ':stop:' + chosen.stop.stop.tag;

    subscribe();
  };

  // Self execution
  (function start() {
    $http
      .get('/agencies')
      .success(function (agencies) {
        $scope.agencies = agencies;
      });
  })();

});
