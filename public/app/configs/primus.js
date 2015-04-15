
UberApp.config(function (primusProvider) {
  primusProvider
    .setOptions({
      reconnect: {
        minDelay: 100,
        maxDelay: 60000,
        retries: 100
      }
    })
    .setDefaultMultiplex(false);
});
