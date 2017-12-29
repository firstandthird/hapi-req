const local = require('./inject.js');
const remote = require('./request.js');
const querystring = require('querystring');
const Boom = require('boom');

const defaults = {
  maxRetries: 0
};

const register = function(server, pluginOptions) {
  const callIt = async (method, url, options, count = 0) => {
    try {
      let response;

      Object.assign(options, defaults, pluginOptions);

      // construct url from any relevant options:
      if (options.query) {
        url += `?${querystring.stringify(options.query)}`;
      }
      if (url[0] === '/') {
        if (pluginOptions.localPrefix) {
          url = `${pluginOptions.localPrefix}${url}`;
        }

        response = await local(server, method, url, options);
      } else {
        response = await remote(method, url, options);
      }

      if (Boom.isBoom(response) || response instanceof Error) {
        throw Boom.boomify(response);
      }

      return response;
    } catch (e) {
      if (count < options.maxRetries) {
        server.log(['hapi-req', 'info'], `Retry #${count + 1}: ${method} ${url}`);
        return callIt(method, url, options, count + 1);
      }

      if (options.maxRetries) {
        server.log(['hapi-req', 'info'], `Max retries: ${method} ${url}`);
      }

      throw e;
    }
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
