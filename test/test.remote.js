'use strict';
const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const hapiReq = require('../index.js');
let testServer;
let server;

lab.experiment('remote', (allDone) => {
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

  lab.test('gets successfully', (done) => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        return reply(null, { f: 'true' });
      }
    });
    code.expect(server.req.get).to.exist();
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('get failures are handled', (done) => {
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      code.expect(err.message).to.equal('Not Found');
      done();
    });
  });

  lab.test('get failures are handled', (done) => {
    server.req.get('http://localhost:8001/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      code.expect(err.message).to.equal('Bad Gateway');
      done();
    });
  });

  lab.test('constructs headers from header args correctly', (done) => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        return reply(null, { result: request.headers.mine });
      }
    });
    code.expect(server.req.get).to.exist();
    server.req.get('http://localhost:8000/literal', { headers: { mine: 'header' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.result).to.equal('header');
      done();
    });
  });

  lab.test('post successfully', (done) => {
    testServer.route({
      path: '/literal',
      method: 'post',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.post).to.exist();
    server.req.post('http://localhost:8000/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      done();
    });
  });

  lab.test('post failures are handled', (done) => {
    server.req.post('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('put successfully', (done) => {
    testServer.route({
      path: '/literal',
      method: 'put',
      handler(request, reply) {
        return reply(null, { result: 'hi' });
      }
    });
    code.expect(server.req.put).to.exist();
    server.req.put('http://localhost:8000/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.result).to.equal('hi');
      done();
    });
  });

  lab.test('put failures are handled', (done) => {
    server.req.put('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('deletes successfully', (done) => {
    testServer.route({
      path: '/literal',
      method: 'delete',
      handler(request, reply) {
        return reply(null, { f: 'true' });
      }
    });
    code.expect(server.req.delete).to.exist();
    server.req.delete('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      done();
    });
  });

  lab.test('delete failures are handled', (done) => {
    server.req.delete('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('patch successfully', (done) => {
    testServer.route({
      path: '/literal',
      method: 'patch',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.patch).to.exist();
    server.req.patch('http://localhost:8000/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      done();
    });
  });

  lab.test('patch failures are handled', (done) => {
    server.req.patch('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('timeout after 5 seconds by default', { timeout: 10000 }, (done) => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        setTimeout(() => reply(null, {}), 6000);
      }
    });
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });
});

lab.experiment('remote', (allDone) => {
  lab.beforeEach((done) => {
    testServer = new hapi.Server();
    testServer.connection({ port: 8000 });
    server = new hapi.Server();
    server.connection({ port: 9000 });
    server.register({
      register: hapiReq,
      options: {
        timeout: 7000
      }
    }, () => {
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
  lab.test('can set timeout option', { timeout: 10000 }, (done) => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        setTimeout(() => reply(null, {}), 6000);
      }
    });
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      done();
    });
  });
  lab.test('timeout after 5 seconds by default', { timeout: 10000 }, (done) => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, reply) {
        setTimeout(() => reply(null, {}), 7100);
      }
    });
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });
});

lab.experiment('remote', (allDone) => {
  lab.beforeEach((done) => {
    testServer = new hapi.Server();
    testServer.connection({ port: 8000 });
    testServer.route({
      path: '/api/literal',
      method: 'get',
      handler(request, reply) {
        return reply(null, { f: 'true' });
      }
    });
    server = new hapi.Server();
    server.connection({ port: 9000 });
    server.register({
      register: hapiReq,
      options: {
        injectPrefix: '/api'
      }
    }, () => {
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
  lab.test('can set prefix option', (done) => {
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      done();
    });
  });
});
