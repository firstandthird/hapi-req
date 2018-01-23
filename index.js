'use strict';
const local = require('./inject.js');
const remote = require('./request.js');
const querystring = require('querystring');

const register = async function(server, pluginOptions) {
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
      return await local(server, method, url, options);
    }
    return await remote(method, url, options);
  };
  const req = {
    get: async (url, options) => {
      return await callIt('get', url, options);
    },
    post: async (url, options) => {
      return await callIt('post', url, options);
    },
    put: async (url, options) => {
      return await callIt('put', url, options);
    },
    delete: async (url, options) => {
      return await callIt('delete', url, options);
    },
    patch: async (url, options) => {
      return await callIt('patch', url, options);
    }
  };
  server.decorate('server', 'req', req);
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
