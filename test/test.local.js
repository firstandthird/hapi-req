const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const hapiReq = require('../index.js');
let testServer;
let server;

lab.experiment('slow warning', () => {
  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({
      port: 9000,
      debug: {
        log: ['*']
      }
    });
    await server.register({
      plugin: hapiReq,
      options: {
        slowWarningLocal: 25
      }
    });
    await testServer.start();
    await server.start();
  });

  lab.afterEach(async () => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('always prints out warning when slowWarningLocal is exceeded', async() => {
    server.route({
      path: '/literal',
      method: 'get',
      async handler(request, h) {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(100);
        return { f: 'true' };
      }
    });
    const logs = [];
    server.events.on('log', (event, tags) => {
      code.expect(tags.warning).to.equal(true); // make sure 'warning' tag is present
      logs.push(event.data);
    });
    await server.req.get('/literal', {});
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(1000);
    const data = logs[0];
    code.expect(Object.keys(data)).to.equal(['url', 'statusCode', 'duration']);
    code.expect(typeof data.duration).to.equal('number');
    code.expect(data.duration).to.be.greaterThan(99);
  });
});

lab.experiment('verbose mode', () => {
  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({
      port: 9000,
      debug: {
        log: ['*']
      }
    });
    await server.register({
      plugin: hapiReq,
      options: {
        verbose: true
      }
    });
    await testServer.start();
    await server.start();
  });

  lab.afterEach(async () => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('verbose mode prints out timing and status code info', async() => {
    server.route({
      path: '/literal',
      method: 'get',
      async handler(request, h) {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(100);
        return { f: 'true' };
      }
    });
    const logs = [];
    server.events.on('log', event => {
      logs.push(event.data);
    });
    await server.req.get('/literal', {});
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(1000);
    const data = logs[0];
    code.expect(Object.keys(data)).to.equal(['url', 'statusCode', 'duration']);
    code.expect(typeof data.duration).to.equal('number');
    code.expect(data.duration).to.be.greaterThan(99);
  });
});

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

  lab.test('constructs url from query args correctly', async () => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { result: request.query };
      }
    });
    code.expect(server.req.get).to.exist();
    // options.query but no url query:
    const result = await server.req.get('/literal', { query: { value: 'abc' } });
    code.expect(result.result).to.equal({ value: 'abc' });
    // options.query with url query:
    const result2 = await server.req.get('/literal?key=xyzzy', { query: { value: 'abc' } });
    code.expect(result2.result).to.equal({ value: 'abc', key: 'xyzzy' });
    // url query with no options.query:
    const result3 = await server.req.get('/literal?key=xyzzy');
    code.expect(result3.result).to.equal({ key: 'xyzzy' });
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

  lab.test('options parameter is optional', async() => {
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('/literal');
    code.expect(result.f).to.equal('true');
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
});

lab.experiment('request', (allDone) => {
  let server;

  lab.beforeEach(async () => {
    server = new hapi.Server({ port: 9000 });
    await server.register({
      plugin: hapiReq,
      options: {
        verbose: true
      }
    });
    await server.start();
  });

  lab.afterEach(async () => {
    await server.stop();
  });

  lab.test('can be called from the request', async () => {
    server.route({
      path: '/request',
      method: 'get',
      handler(request, h) {
        code.expect(request.get).to.exist();
        return request.get('/literal', {});
      }
    });
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    const response = await server.req.get('/request');
    code.expect(response).to.equal({ f: 'true' });
  });

  lab.test('verbose mode includes request url when called from request', async () => {
    server.route({
      path: '/request',
      method: 'get',
      handler(request, h) {
        return request.get('/literal');
      }
    });
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    const statements = [];
    server.events.on('log', (event, tags) => {
      statements.push(event.data);
    });
    await server.req.get('/request');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(300);
    code.expect(typeof statements[0].duration).to.equal('number');
    delete statements[0].duration;
    code.expect(statements[0]).to.equal({
      url: '/literal',
      statusCode: 200,
      requestUrl: '/request'
    });
  });

  lab.test('will add response time to hapi-timing if it is in use', async () => {
    server.route({
      path: '/request',
      method: 'get',
      async handler(request, h) {
        request.timingStart = () => {};
        request.plugins['hapi-timing'] = {};
        const result = await request.get('/literal', {});
        code.expect(typeof request.plugins['hapi-timing']['hapi-req']).to.equal('number');
        return result;
      }
    });
    server.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    const response = await server.req.get('/request');
    code.expect(response).to.equal({ f: 'true' });
  });
});
