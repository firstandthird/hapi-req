'use strict';
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
  const { res, payload } = await wreck[method](url, packet);
  if (options.returnResponse) {
    return { result: res, payload };
  }
  if (res.statusCode > 400) {
    throw Boom.create(res.statusCode, (payload ? payload.message : false) || res.statusMessage, payload);
  }
  return payload;
};
