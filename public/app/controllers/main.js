
UberApp.controller('MainController', function (
  $scope,
  $http,
  $log,
  primus) {

  $scope.step = 1;
  $scope.agencies = {};
  $scope.routes = {};
  $scope.stops = {};
  $scope.chosen = {};

  $scope.selectAgency = function (agency) {
    $log.info(agency);
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

  // $scope.selectStop = function (stop)

  $scope.selectStep = function (step) {
    $scope.step = step;
  };

  function start() {
    $http
      .get('/agencies')
      .success(function (agencies) {
        $scope.agencies = agencies;
      });
  }

  start();

});
