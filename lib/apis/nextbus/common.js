
var config = {};

var co = require('co');
var coRedis = require('co-redis');
var xml2json = require('xml2json');
var debug = require('debug')('uber:nextbus:common');
var request = require('superagent-bluebird-promise');
var redis = require('redis').createClient(process.env.REDISCLOUD_URL || '');
var config = require('envcfg')(__dirname + '/../../../config/api.json');

// Let us use the redis module as a promise, which is yieldable
// Thanks generators :)
redis = coRedis(redis);

/**
 * Object exported, that makes all api calls out to NextBus, enforces caching
 * out to redis.
 * 
 * @type {Object}
 */
module.exports = {
  /**
   * Make the request and log to redis if specified
   * @param  {string} command [GET param]
   * @param  {object} query   [command specific GET params]
   * @return {object}         [Object, with props to exec and turn off/on caching]
   */
  request: function (command, query) {
    // Make sure there a command
    if (!command) {
      console.error('No command included, bailing on NextBus API call');
      return;
    }

    // Make sure a query is given
    if (typeof query !== 'object') {
      debug('No query supplied');
      query = {};
    }

    debug('Executing NextBus API call to %s: %s', 
      command, 
      JSON.stringify(query));

    var redisKey = this._generateKey(query);

    /**
     * Two things need to happen here. To optimize this application server
     * we want to store data in redis and cache it for furture idenical 
     * requests. So first, check the cache. If we don't have that then make
     * the call to the NextBus API then store the result in Redis with a 
     * lifespan of 200 seconds.
     */
    return {
      _useCache: true,
      /**
       * Perform the request to the API
       * @return {[Promise (native, ES6)]}
       */
      exec: function () {
        var self = this;
        return co(function *() {
          var cache = yield redis.get(redisKey);

          if (!cache) {
            debug('No cache for you!~');
            return yield request.get(config.nextbus)
              .set('Accept', 'application/xml')
              .query({ command: command })
              .query(query)
              .then(function (result) {
                // The NextBus api will return a 200 status code even if there 
                // is an error in the response. So we have to parse that to xml,
                // check that there isn't an error property before 
                // saving to the cache.
                if (self._useCache) {
                  debug('Setting cache, no error on resposne');
                  // Set in redis for 200 seconds
                  redis.setex(redisKey, 200, JSON.stringify(result));
                } else {
                  debug('Not using cache!, you turned it off');
                }

                return result;
              });
          }

          debug('Returning cache');
          
          try {
            cache = JSON.parse(cache);
            return cache;
          } catch (e) {
            console.error(e.stack);
          }
        });
      },
      /**
       * Turn caching on/off
       * @param  {bool} on
       * @return {this/scope}    [method chaining]
       */
      cache: function (on) {
        this._useCache = on;
        return this;
      }
    };
  },
  /** 
   * Here we are creating a key for data to be stored in redis. It is based
   * on the keys of the root of given object. It is exported to be used in tests
   * but nowhere else.
   */
  _generateKey: function (obj) {
    var currkey;
    var redisKey = '';
    var keys = Object.keys(obj);
    var numKeys = keys.length;
    for (var i = 0; i < numKeys; i++) {
      if ((i + 1) < numKeys) {
        redisKey += obj[keys[i]] + ':';
        continue;
      }

      redisKey += obj[keys[i]];
    }

    return redisKey;
  }

};
