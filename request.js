'use strict';
const wreck = require('wreck');
module.exports = (method, url, options, callback) => {
  console.log(';called:')
  console.log(method)
  console.log(url)
  console.log(options)
  console.log(callback)
  console.log(wreck[method])
  if (['get', 'delete'].indexOf(method) > -1) {
    return wreck[method](url, (err, result, payload) => {
      const ret = payload ? payload.toString() : null;
      callback(err, ret);
    });
  }
  return wreck[method](url, options.payload, (err, result, payload) => {
    const ret = payload ? payload.toString() : null;
    callback(err, ret);
  });
};
