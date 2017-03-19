'use strict';
const wreck = require('wreck');
module.exports = (method, url, data, callback) => {
  if (typeof data === callback) {
    callback = data;
  }
  if (['get', 'delete'].indexOf(method) > -1) {
    return wreck[method](url, callback);
  }
  return wreck[method](url, data, callback);
};
