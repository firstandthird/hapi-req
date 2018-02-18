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
  const duration = endDate.getTime() - startDate.getTime();
  if (duration > options.slowWarningRemote) {
    server.log(['hapi-req', 'remote', 'warning'], {
      url,
      statusCode: res.statusCode,
      duration
    });
  } else if (options.verbose) {
    server.log(['hapi-req', 'info'], {
      url,
      statusCode: res.statusCode,
      duration
    });
  }

  if (options.returnResponse) {
    return { result: res, payload };
  }
  return payload;
};
