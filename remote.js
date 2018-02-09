'use strict';
const wreck = require('wreck');

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
  return payload;
};
