const Boom = require('boom');
module.exports = (server, method, url, data, done) => {
  server.inject({
    method,
    url,
    payload: data
  }, (res) => {
    if (res.statusCode !== 200) {
      return done(Boom.create(res.statusCode, res.statusMessage, res.payload));
    }
    const output = JSON.parse(res.payload);
    done(null, output);
  });
};

exports.register.attributes = {
  name: 'request'
};
