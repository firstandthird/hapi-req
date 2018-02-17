'use strict';
const wreck = require('wreck');

module.exports = async (server, method, url, options) => {
  const packet = { json: options.json };
  if (options.headers) {
    packet.headers = options.headers;
  }
  if (options.payload) {
    packet.payload = options.payload;
  }
  packet.timeout = options.timeout || 5000;
  const startDate = new Date();
  const { res, payload } = await wreck[method](url, packet);
  const endDate = new Date();
  if (options.verbose) {
    server.log(['hapi-req', 'info'], `Request ${url} status was HTTP ${res.statusCode} took ${endDate.getTime() - startDate.getTime()}ms`);
  }

  if (options.returnResponse) {
    return { result: res, payload };
  }
  return payload;
};
