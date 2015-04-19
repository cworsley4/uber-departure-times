
UberApp.controller('MainController', function (
  $rootScope,
  $scope,
  $http,
  $window,
  $log,
  ipCookie,
  primus,
  uiGmapIsReady
) {

  var targetEvent;
  var subscriptionData;

  $scope.wait = true;
  $scope.step = 1;
  $scope.stops = {};
  $scope.chosen = {};
  $scope.routes = {};
  $scope.agencies = {};

  uiGmapIsReady.promise(1).then(function(instances) {
    $scope.wait = false;
  });

  // We need to resubscribe to this data if the server bounces
  primus.$on('reconnect', function () {
    if (subscriptionData) {
      primus.send('subscribe:stop', subscriptionData);
    }
  });

  function subscribe () {
    // Display the loader animation
    $scope.loading = true;
    $log.info('Subscribing', targetEvent, 'with', subscriptionData);
    primus.send('subscribe:stop', subscriptionData);

    // Listener for socket event
    primus.$on(targetEvent, function (data) {
      var result = JSON.parse(data);
      var predictions = result || {};

      if (result.body.Error) {
        // TODO: Display flash message
        $log.error('Bad data', predictions.Error);
        return;
      }

      // Prepare predictions object
      predictions = predictions.body || {};
      predictions = predictions.predictions || {};
      
      var direction = predictions.direction || [];
      
      // Correcting for when api changes data types from an array of objects to
      // just a single object
      if (direction.length 
        && typeof direction.prediction !== 'array') {
        $log.info('Fixing api data types');
        var onlyPrediction = direction.prediction;
        direction.prediction = [];
        direction.prediction.push(onlyPrediction);
      }

      predictions.direction = direction;

      $scope.predictions = predictions;
      $scope.loading = false;
    });
  }

  // Allow editing of steps
  $scope.back = function () {
    if ($scope.step > 1) {
      $scope.step--;
    }
  };

  $scope.selectAgency = function (agency) {
    $http
      .get('/routes/' + agency.tag)
      .success(function (routes) {
        $log.info('Routes', routes);
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
        $rootScope.$emit('gotStops', stops);
        $scope.step = 3;
        $scope.stops = stops;
        $scope.chosen.route = route;
      });
  };

  $scope.selectStop = function (stop) {
    $scope.chosen.stop = stop;
    var chosen = $scope.chosen;
    ipCookie('agency', chosen.agency);
    ipCookie('route', chosen.route);
    ipCookie('stop', chosen.stop);

    $rootScope.$emit('choseStop', stop);

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
