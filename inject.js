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
      return done(Boom.create(res.statusCode, res.statusMessage, res.payload));
    }
    const output = JSON.parse(res.payload);
    done(null, output);
  });
};
