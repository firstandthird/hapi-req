const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const hapiReq = require('../index.js');
let testServer;
let server;

lab.experiment('local', () => {
  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({ port: 9000 });
    await server.register(hapiReq);
    await testServer.start();
    await server.start();
  });

  lab.afterEach(async () => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('gets successfully', async() => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('/literal', {});
    code.expect(result.f).to.equal('true');
  });

  lab.test('get failures are handled', async () => {
    try {
      await server.req.get('/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('support option to get back response object', async () => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    const result = await server.req.get('/literal', { returnResponse: true });
    code.expect(result).to.not.equal(null);
    code.expect(result.result.statusCode).to.equal(200);
    code.expect(result.result.headers).to.not.equal(null);
    code.expect(result.payload.f).to.equal('true');
  });

  lab.test('constructs url from  query args correctly', async () => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { result: request.query.value };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('/literal', { query: { value: 'abc' } });
    code.expect(result.result).to.equal('abc');
  });

  lab.test('constructs headers from header args correctly', async () => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { result: request.headers.mine };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('/literal', { headers: { mine: 'header' } });
    code.expect(result.result).to.equal('header');
  });

  lab.test('post successfully', async () => {
    server.route({
      path: '/literal',
      method: 'post',
      handler(request, h) {
        return request.payload;
      }
    });
    code.expect(server.req.post).to.exist();
    const result = await server.req.post('/literal', { payload: { f: 'true' } });
    code.expect(result.f).to.equal('true');
  });

  lab.test('post failures are handled', async () => {
    try {
      await server.req.post('/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('parse failures are handled', async() => {
    server.route({
      path: '/literal',
      method: 'post',
      handler(request, h) {
        return 'not json';
      }
    });
    code.expect(server.req.post).to.exist();
    try {
      await server.req.post('/literal', { payload: { t: true } });
    } catch (err) {
      code.expect(err).to.not.equal(null);
      code.expect(err.output.payload.message).to.equal('returned payload was not valid JSON');
    }
  });

  lab.test('put successfully', async () => {
    server.route({
      path: '/literal',
      method: 'put',
      handler(request, h) {
        return request.payload;
      }
    });
    code.expect(server.req.put).to.exist();
    const result = await server.req.put('/literal', { payload: { f: 'true' } });
    code.expect(result.f).to.equal('true');
  });

  lab.test('put failures are handled', async () => {
    try {
      await server.req.put('/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('deletes successfully', async() => {
    server.route({
      path: '/literal',
      method: 'delete',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    code.expect(server.req.delete).to.exist();
    const result = await server.req.delete('/literal', {});
    code.expect(result.f).to.equal('true');
  });

  lab.test('delete failures are handled', async() => {
    try {
      await server.req.delete('/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('patch successfully', async() => {
    server.route({
      path: '/literal',
      method: 'patch',
      handler(request, h) {
        return request.payload;
      }
    });
    code.expect(server.req.patch).to.exist();
    const result = await server.req.patch('/literal', { payload: { f: 'true' } });
    code.expect(result.f).to.equal('true');
  });

  lab.test('patch failures are handled', async() => {
    try {
      await server.req.patch('/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });
});

lab.experiment('local', () => {
  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({ port: 9000 });
    await server.register({
      plugin: hapiReq,
      options: {
        localPrefix: '/api'
      }
    });
    server.route({
      path: '/api/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    await testServer.start();
    await server.start();
  });

  lab.afterEach(async() => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('localPrefix plugin option', async () => {
    await server.req.get('/literal', {});
  });
});

lab.experiment('retry', () => {
  let retryCount = 0;

  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({ port: 9000 });
    await server.register({
      plugin: hapiReq,
      options: {
        maxRetries: 2
      }
    });
    await testServer.start();
    await server.start();
  });

  lab.afterEach(async () => {
    await testServer.stop();
    await server.stop();
    retryCount = 0;
  });

  lab.test('failures are retried', async () => {
    server.route({
      path: '/error',
      method: 'get',
      handler(request, h) {
        retryCount++;

        if (retryCount > 1) {
          return { count: retryCount };
        }

        throw new Error('test error');
      }
    });

    const response = await server.req.get('/error', {});
    code.expect(response.count).to.equal(2);
  });

  lab.test('failures are retried', async () => {
    server.route({
      path: '/error',
      method: 'get',
      handler(request, h) {
        throw new Error('test error');
      }
    });

    const response = await server.req.get('/error', {});
    code.expect(response.isBoom).to.equal(true);
  });
});
