'use strict';
const wreck = require('wreck');
const Boom = require('boom');

module.exports = (method, url, options, callback) => {
  const packet = { json: 'force' };
  if (options.headers) {
    packet.headers = options.headers;
  }
  if (options.payload) {
    packet.payload = options.payload;
  }
  packet.timeout = options.timeout || 5000;

  return wreck[method](url, packet, (err, res, payload) => {
    if (err) {
      return callback(Boom.create(err.output.statusCode, err.output.payload.error, payload));
    }
    if (res.statusCode !== 200) {
      return callback(Boom.create(res.statusCode, payload.message || res.statusMessage, payload));
    }
    callback(err, payload);
  });
};
