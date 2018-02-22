'use strict';
const wreck = require('wreck');

module.exports = async (server, method, url, options) => {
  const packet = { json: options.json };
  packet.headers = options.headers || {};
  if (options.payload) {
    packet.payload = options.payload;
  }
  packet.timeout = options.timeout || 5000;
  if (options.request) {
    packet.headers.referrer = options.request.url.href;
  }
  const startDate = new Date();
  const { res, payload } = await wreck[method](url, packet);
  const endDate = new Date();
  const duration = endDate.getTime() - startDate.getTime();
  if (options.request && options.request.timingStart) {
    options.request.plugins['hapi-timing']['hapi-req'] = duration;
  }
  if (options.slowWarningRemote && duration > options.slowWarningRemote) {
    server.log(['hapi-req', 'remote', 'warning', 'slow'], {
      url,
      statusCode: res.statusCode,
      duration,
      threshold: options.slowWarningRemote
    });
  } else if (options.verbose) {
    const data = {
      url,
      statusCode: res.statusCode,
      duration,
      threshold: options.slowWarningRemote
    };
    if (options.request) {
      data.requestUrl = options.request.url.href;
    }
    server.log(['hapi-req', 'info'], data);
  }

  if (options.returnResponse) {
    return { result: res, payload };
  }
  return payload;
};
