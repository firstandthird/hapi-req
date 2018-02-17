const local = require('./local.js');
const remote = require('./remote.js');
const querystring = require('querystring');

const defaults = {
  maxRetries: 0,
  json: 'force'
};

const register = function(server, pluginOptions = {}) {
  const callIt = async (method, url, methodOptions = {}, count = 0) => {
    const options = Object.assign({}, defaults, methodOptions, pluginOptions);
    try {
      let response;
      // construct url from any relevant options:
      const optionsQueryString = querystring.stringify(options.query);
      if (optionsQueryString) {
        url = `${url}${url.includes('?') ? '&' : '?'}${optionsQueryString}`;
      }
      if (url[0] === '/') {
        if (pluginOptions.localPrefix) {
          url = `${pluginOptions.localPrefix}${url}`;
        }
        response = await local(server, method, url, options);
      } else {
        response = await remote(server, method, url, options);
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
