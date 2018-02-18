const Boom = require('boom');

module.exports = async(server, method, url, options) => {
  const packet = {
    method,
    url
  };

  if (options.payload) {
    packet.payload = options.payload;
  }

  if (options.headers) {
    packet.headers = options.headers;
  }
  const startDate = new Date();
  const res = await server.inject(packet);
  const endDate = new Date();
  const timeElapsed = endDate.getTime() - startDate.getTime();
  if (timeElapsed > options.slowWarningLocal) {
    server.log(['hapi-req', 'local', 'warning'], {
      url,
      statusCode: res.statusCode,
      timeElapsed
    });
  } else if (options.verbose) {
    server.log(['hapi-req', 'info'], {
      url,
      statusCode: res.statusCode,
      timeElapsed
    });
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
