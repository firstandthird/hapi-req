const Boom = require('boom');
module.exports = (server, method, url, options, done) => {
  console.log('gonna inject it:')
  console.log(method)
  console.log(url)
  console.log(options)
  console.log(done)
  const packet = {
    method,
    url
  };
  if (options.payload) {
    packet.payload = options.payload;
  }
  server.inject(packet, (res) => {
    if (res.statusCode !== 200) {
      return done(Boom.create(res.statusCode, res.statusMessage, res.payload));
    }
    const output = JSON.parse(res.payload);
    done(null, output);
  });
};
