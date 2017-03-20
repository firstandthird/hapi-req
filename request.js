'use strict';
const wreck = require('wreck');
const Boom = require('boom');

module.exports = (method, url, options, callback) => {
  const packet = {};
  if (options.headers) {
    packet.headers = options.headers;
  }
  if (options.payload) {
    packet.payload = options.payload;
  }
  if (['get', 'delete'].indexOf(method) > -1) {
    return wreck[method](url, (err, res, payload) => {
      if (err) {
        return callback(Boom.create(500, res.statusMessage, payload));
      }
      if (res.statusCode !== 200) {
        return callback(Boom.create(res.statusCode, res.statusMessage, {}));
      }
      const output = JSON.parse(payload.toString());
      callback(null, output);
    });
  }
  return wreck[method](url, options.payload, (err, res, payload) => {
    if (err) {
      return callback(Boom.create(err.outupt.statusCode, err.output.payload.error, payload));
    }
    if (res.statusCode !== 200) {
      return callback(Boom.create(res.statusCode, res.statusMessage, {}));
    }
    const ret = payload ? payload.toString() : null;
    callback(err, ret);
  });
};
