'use strict';
const Boom = require('boom');
module.exports = (server, method, url, options, done) => {
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

  server.inject(packet, (res) => {
    if (res.statusCode !== 200) {
      return done(Boom.create(res.statusCode, res.payload.message || res.statusMessage, res.payload));
    }
    let out = null;
    try {
      out = JSON.parse(res.payload);
    } catch (e) {
      return done(Boom.badRequest('returned payload was not valid JSON', res.payload));
    }
    if (options.returnResponse) {
      return done(null, { result: res, payload: out });
    }
    done(null, out);
  });
};
