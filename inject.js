'use strict';
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

  const res = await server.inject(packet);
  if (res.statusCode !== 200) {
    return Boom.create(res.statusCode, res.payload.message || res.statusMessage, res.payload);
  }
  let out = null;
  try {
    out = JSON.parse(res.payload);
    if (options.returnResponse) {
      return { result: res, payload: out };
    }
    return out;
  } catch (e) {
    return Boom.badRequest('returned payload was not valid JSON', res.payload);
  }
};
