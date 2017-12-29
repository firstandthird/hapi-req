const wreck = require('wreck');
const Boom = require('boom');

module.exports = async (method, url, options) => {
  const packet = { json: 'force' };

  if (options.headers) {
    packet.headers = options.headers;
  }

  if (options.payload) {
    packet.payload = options.payload;
  }

  packet.timeout = options.timeout || 5000;

  try {
    const { res, payload } = await wreck[method](url, packet);

    if (options.returnResponse) {
      return { result: res, payload };
    }

    if (res.statusCode !== 200) {
      return new Boom((payload ? payload.message : false) || res.statusMessage, {
        statusCode: res.statusCode,
        data: payload
      });
    }

    return payload;
  } catch (err) {
    return new Boom(err.output.payload.error, {
      statusCode: err.output.payload.statusCode || 500
    });
  }
};
