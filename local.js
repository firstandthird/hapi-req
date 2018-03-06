const Boom = require('boom');

module.exports = async(server, method, url, options) => {
  const packet = {
    method,
    url
  };
  packet.headers = options.headers || {};

  if (options.payload) {
    packet.payload = options.payload;
  }
  if (options.request) {
    packet.headers.referrer = options.request.url.href;
  }
  const startDate = new Date();
  const res = await server.inject(packet);
  const endDate = new Date();
  const duration = endDate.getTime() - startDate.getTime();
  if (options.request && options.request.timingStart) {
    options.request.plugins['hapi-timing']['hapi-req'] = duration;
  }
  if (options.slowWarningLocal && duration > options.slowWarningLocal) {
    server.log(['hapi-req', 'local', 'warning', 'slow'], {
      url,
      statusCode: res.statusCode,
      duration,
      threshold: options.slowWarningLocal
    });
  } else if (options.verbose) {
    const data = {
      url,
      statusCode: res.statusCode,
      duration,
      threshold: options.slowWarningLocal
    };
    if (options.request) {
      data.requestUrl = options.request.url.href;
    }
    server.log(['hapi-req', 'info'], data);
  }

  if (res.statusCode >= 400) {
    throw Boom.boomify(res);
  }

  // if json is true then just return the paylod buffer without trying to parse it:
  if (options.json) {
    if (options.returnResponse) {
      return { result: res, payload: res.payload };
    }
    return res.payload;
  }
  let out = null;

  try {
    out = JSON.parse(res.payload);
    if (options.returnResponse) {
      return { result: res, payload: out };
    }
    return out;
  } catch (e) {
    throw Boom.badRequest('returned payload was not valid JSON', res.payload);
  }
};
