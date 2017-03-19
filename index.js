'use strict';
const local = require('./inject.js');
const remote = require('./request.js');

exports.register = function(server, options, next) {
  const callIt = (method, url, data, callback) => {
    if (url[0] === '/') {
      return remote(server, method, url, data, callback);
    }
    return local(server, method, url, data, callback);
  };
  server.method('req.get', (method, url, callback) => {
    callIt(method, url, callback);
  });
  server.method('req.delete', (method, url, callback) => {
    callIt(method, url, callback);
  });
  server.method('req.put', (method, url, data, callback) => {
    callIt(method, url, data, callback);
  });
  server.method('req.post', (method, url, data, callback) => {
    callIt(method, url, data, callback);
  });
  server.method('req.patch', (method, url, data, callback) => {
    callIt(method, url, data, callback);
  });
};

exports.register.attributes = {
  name: 'request'
};
