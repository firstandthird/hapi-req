'use strict';
const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const hapiReq = require('../index.js');
let testServer;
let server;

lab.experiment('local', (allDone) => {
  lab.beforeEach((done) => {
    testServer = new hapi.Server();
    testServer.connection({ port: 8000 });
    server = new hapi.Server();
    server.connection({ port: 9000 });
    server.register(hapiReq, () => {
      testServer.start(() => {
        server.start(done);
      });
    });
  });

  lab.afterEach((done) => {
    testServer.stop(() => {
      server.stop(done);
    });
  });

  lab.test('loads', (done) => {
    done();
  });

  lab.test('gets successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        return reply(null, { f: 'true' });
      }
    });
    code.expect(server.req.get).to.exist();
    server.req.get('literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('get failures are handled', (done) => {
    server.req.get('literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('post successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'post',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.post).to.exist();
    server.req.post('literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('post failures are handled', (done) => {
    server.req.post('literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });
});
