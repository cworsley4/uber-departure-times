
UberApp.config(function (primusProvider) {
  primusProvider
    .setEndpoint('/primus')
    .setOptions({
      reconnect: {
        minDelay: 100,
        maxDelay: 60000,
        retries: 100
      }
    })
    .setDefaultMultiplex(false);
});
