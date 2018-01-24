'use strict';
const local = require('./inject.js');
const remote = require('./request.js');
const querystring = require('querystring');

const register = function(server, pluginOptions) {
  const callIt = async (method, url, options) => {
    if (!options) {
      options = {};
    }
    Object.assign(options, pluginOptions);
    // construct url from any relevant options:
    if (options.query) {
      url += `?${querystring.stringify(options.query)}`;
    }
    if (url[0] === '/') {
      if (pluginOptions.localPrefix) {
        url = `${pluginOptions.localPrefix}${url}`;
      }
      return local(server, method, url, options);
    }
    return remote(method, url, options);
  };
  const req = {
    get: (url, options) => callIt('get', url, options),
    post: (url, options) => callIt('post', url, options),
    put: (url, options) => callIt('put', url, options),
    delete: (url, options) => callIt('delete', url, options),
    patch: (url, options) => callIt('patch', url, options)
  };
  server.decorate('server', 'req', req);
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
