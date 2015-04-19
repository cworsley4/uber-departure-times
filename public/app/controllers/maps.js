
// TODO: Should probably be a directive
UberApp.controller('MapsController', function (
  $rootScope,
  $scope,
  $log,
  uiGmapGoogleMapApi,
  $geolocation
) {
  $scope.map = {
    center: {}
  };

  $geolocation.getCurrentPosition()
    .then(function (location) {
      $scope.map.center = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      $scope.map.zoom = 8;
  });

  var bounds = {};
  var markers = [];
  var mostSouthWest = {};
  var mostNorthEast = {};
  
  function setNewBounds(lat, lon) {
    // Set the first cord as the most southwestern and northeaster
    // so that we can start comparing against the inital values
    if (!mostSouthWest.latitude && !mostSouthWest.longitude) {
      mostSouthWest.latitude = lat;
      mostSouthWest.longitude = lon;
    }
    
    // Set the first cord as the most southwestern and northeaster
    // so that we can start comparing against the inital values
    if (!mostNorthEast.latitude && !mostNorthEast.longitude) {
      mostNorthEast.latitude = lat;
      mostNorthEast.longitude = lon;
    }

    // Determine the southwestern most point, set if previous value was greater
    if (mostSouthWest.latitude > lat && mostSouthWest.longitude > lon) {
      mostSouthWest.latitude = lat;
      mostSouthWest.longitude = lon;        
    }

    // Determine the northwestern most point, set if previous value was lesser
    if (mostNorthEast.latitude < lat && mostNorthEast.longitude < lon) {
      mostNorthEast.latitude = lat;
      mostNorthEast.longitude = lon;        
    }

    return {
      southwest: mostSouthWest,
      northeast: mostNorthEast
    };
  }

  $rootScope.$on('choseStop', function (event, stop) {
    $log.info('choseStop', stop);
    stop = stop || {};
    stop = stop.stop;

    var id = stop.id;
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i];
      $log.log(marker.id, stop.tag);
      if (marker.id === stop.tag) {
        $scope.map.center.latitude = stop.lat;
        $scope.map.center.longitude = stop.lon;
        $scope.map.zoom = 19;
        break;
      }
    }

    $scope.markers = markers;
    // add animation to the markers array
    // set markers on scope
  });

  $rootScope.$on('gotStops', function (event, stops) {
    stops = stops.stops;
    var stopKeys = Object.keys(stops);

    // Generate markers payload for gmap
    for (var i = 0; i < stopKeys.length; i++) {
      var key = stopKeys[i];
      var stop = stops[key].stop;

      bounds = setNewBounds(stop.lat, stop.lon);

      markers.push({
        id: stop.tag,
        latitude: stop.lat,
        longitude: stop.lon,
        title: stop.title || ''
      });
    }

    $log.debug({
      southwest: mostSouthWest,
      northeast: mostNorthEast
    });

    $scope.markers = markers;
    $scope.map.bounds = bounds;
  });

  uiGmapGoogleMapApi.then(function(maps) {
    $rootScope.$emit('gmapsReady');
  });
});
