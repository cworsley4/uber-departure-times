
UberApp.config(function (primusProvider) {
  primusProvider
    .setEndpoint('http://localhost:3000/primus')
    .setOptions({
      reconnect: {
        minDelay: 100,
        maxDelay: 60000,
        retries: 100
      }
    })
    .setDefaultMultiplex(false);
});
