
UberApp.controller('MainController', function (
  $rootScope
) {

  $rootScope.$on('FlashMessage', function () {
    console.log(arguments);
  });

});
