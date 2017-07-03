'use strict';
const local = require('./inject.js');
const remote = require('./request.js');
const querystring = require('querystring');

exports.register = function(server, pluginOptions, next) {
  const callIt = (method, url, options, callback) => {
    Object.assign(options, pluginOptions);
    // construct url from any relevant options:
    if (options.query) {
      url += `?${querystring.stringify(options.query)}`;
    }
    if (url[0] === '/') {
      if (pluginOptions.localPrefix) {
        url = `${pluginOptions.localPrefix}${url}`;
      }
      return local(server, method, url, options, callback);
    }
    return remote(method, url, options, callback);
  };
  const req = {
    get(url, options, callback) {
      callIt('get', url, options, callback);
    },
    post(url, options, callback) {
      callIt('post', url, options, callback);
    },
    put(url, options, callback) {
      callIt('put', url, options, callback);
    },
    delete(url, options, callback) {
      callIt('delete', url, options, callback);
    },
    patch(url, options, callback) {
      callIt('patch', url, options, callback);
    }
  };
  server.decorate('server', 'req', req);
  next();
};

exports.register.attributes = {
  name: 'hapi-req'
};
