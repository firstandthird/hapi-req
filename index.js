'use strict';
const local = require('./inject.js');
const remote = require('./request.js');

exports.register = function(server, pluginOptions, next) {
  const callIt = (method, url, options, callback) => {
    Object.assign(options, pluginOptions);
    if (options.query) {
      const queries = [];
      Object.keys(options.query).forEach((queryKey) => {
        queries.push(`${queryKey}=${options.query[queryKey]}`);
      });
      url += `?${queries.join('&')}`;
    }
    // todo: headers
    // if (options.headers) {
    // }
    // construct url from options:
    if (url[0] === '/') {
      return remote(server, method, url, options, callback);
    }
    return local(server, method, `/${url}`, options, callback);
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
