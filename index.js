const local = require('./local.js');
const remote = require('./remote.js');
const querystring = require('querystring');

const defaults = {
  maxRetries: 0,
  slowWarningRemote: false,
  slowWarningLocal: false,
  json: 'force'
};

const register = function(server, pluginOptions = {}) {
  const callIt = async (method, url, methodOptions = {}, count = 0) => {
    const options = Object.assign({}, defaults, methodOptions, pluginOptions);
    try {
      let response;
      // construct url from any relevant options:
      const optionsQueryString = querystring.stringify(options.query);
      if (count === 0 && optionsQueryString) {
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
      const statusCode = e.isBoom ? e.output.statusCode : e.statusCode;
      if (statusCode > 499) {
        if (count < options.maxRetries) {
          server.log(['hapi-req', 'info'], `Retry #${count + 1}: ${method} ${url} ${statusCode}`);
          return callIt(method, url, options, count + 1);
        }
        // only log if we've retried previously:
        if (count > 0 && options.maxRetries) {
          server.log(['hapi-req', 'info'], `Max retries: ${method} ${url} ${statusCode}`);
        }
      }
      if (options.logErrors) {
        server.log(['hapi-req', 'error'], { message: e.message, method, url, error: e });
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

  // 'apply' will regenerate the functions in request.req for each incoming request:
  server.decorate('request', 'req', (request) => ({
    get(url, options = {}) {
      options.request = request;
      return callIt('get', url, options);
    },
    post(url, options = {}) {
      options.request = request;
      return callIt('post', url, options);
    },
    put(url, options = {}) {
      options.request = request;
      return callIt('put', url, options);
    },
    delete(url, options = {}) {
      options.request = request;
      return callIt('delete', url, options);
    },
    patch(url, options = {}) {
      options.request = request;
      return callIt('patch', url, options);
    },
  }), { apply: true });
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
