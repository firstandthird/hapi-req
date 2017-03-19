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
    server.req.get('http://localhost:8000/literal', {}, (err, result, payload) => {
      console.log('+++')
      console.log(err)
      console.log(result)
      console.log(payload)
      code.expect(err).to.equal(null);
      code.expect(payload.f).to.equal('true');
      done();
    });
  });

  lab.test('get failures are handled', (done) => {
    server.req.get('http://localhost:8000/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });
/*
  lab.test('post successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'post',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.post).to.exist();
    server.req.post('/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('post failures are handled', (done) => {
    server.req.post('/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('put successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'put',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.put).to.exist();
    server.req.put('/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('put failures are handled', (done) => {
    server.req.put('/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('deletes successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'delete',
      handler(request, reply) {
        return reply(null, { f: 'true' });
      }
    });
    code.expect(server.req.delete).to.exist();
    server.req.delete('/literal', {}, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('delete failures are handled', (done) => {
    server.req.delete('/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });

  lab.test('patch successfully', (done) => {
    server.route({
      path: '/literal',
      method: 'patch',
      handler(request, reply) {
        return reply(null, request.payload);
      }
    });
    code.expect(server.req.patch).to.exist();
    server.req.patch('/literal', { payload: { f: 'true' } }, (err, result) => {
      code.expect(err).to.equal(null);
      code.expect(result.f).to.equal('true');
      done();
    });
  });

  lab.test('patch failures are handled', (done) => {
    server.req.patch('/literal', {}, (err, result) => {
      code.expect(err).to.not.equal(null);
      done();
    });
  });
*/
});
