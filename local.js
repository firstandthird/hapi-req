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
  const timeElapsed = endDate.getTime() - startDate.getTime();
  if (options.request && options.request.timingStart) {
    options.request.plugins['hapi-timing']['hapi-req'] = timeElapsed;
  }
  if (options.verbose) {
    const data = {
      url,
      statusCode: res.statusCode,
      timeElapsed
    };
    if (options.request) {
      data.requestUrl = options.request.url.href;
    }
    server.log(['hapi-req', 'info'], data);
  }

  if (res.statusCode >= 400) {
    throw Boom.boomify(res);
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
