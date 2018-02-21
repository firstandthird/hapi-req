const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const hapiReq = require('../index.js');

lab.experiment('slow warning', (allDone) => {
  let testServer;
  let server;

  lab.beforeEach(async() => {
    testServer = new hapi.Server({
      port: 8000,
    });
    server = new hapi.Server({
      port: 9000,
      debug: {
        log: ['*', 'hapi-req']
      }
    });
    await server.register({
      plugin: hapiReq,
      options: {
        slowWarningRemote: 25
      }
    });
    await testServer.start();
    await server.start();
  });
  lab.afterEach(async() => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('always prints out warning when slowWarningRemote is exceeded', { timeout: 10000 }, async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(100);
        return {};
      }
    });
    const logs = [];
    server.events.on('log', (event, tags) => {
      code.expect(tags.warning).to.equal(true); // make sure 'warning' tag is present
      code.expect(tags.slow).to.equal(true); // make sure 'slow' tag is present
      logs.push(event.data);
    });
    await server.req.get('http://localhost:8000/literal', {});
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2000);
    const data = logs[0];
    code.expect(Object.keys(data)).to.equal(['url', 'statusCode', 'duration', 'threshold']);
    code.expect(typeof data.duration).to.equal('number');
    code.expect(data.duration).to.be.greaterThan(99);
  });
});

lab.experiment('slow warning disabled', (allDone) => {
  let testServer;
  let server;

  lab.beforeEach(async() => {
    testServer = new hapi.Server({
      port: 8000,
    });
    server = new hapi.Server({
      port: 9000,
      debug: {
        log: ['*', 'hapi-req']
      }
    });
    await server.register({
      plugin: hapiReq,
      options: {
        slowWarningRemote: false
      }
    });
    await testServer.start();
    await server.start();
  });
  lab.afterEach(async() => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('always prints out warning when slowWarningRemote is exceeded', { timeout: 10000 }, async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(100);
        return {};
      }
    });
    const logs = [];
    server.events.on('log', (event, tags) => {
      code.expect(tags.warning).to.equal(true); // make sure 'warning' tag is present
      logs.push(event.data);
    });
    await server.req.get('http://localhost:8000/literal', {});
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2000);
    code.expect(logs.length).to.equal(0);
  });
});

lab.experiment('verbose mode', (allDone) => {
  let testServer;
  let server;

  lab.beforeEach(async() => {
    testServer = new hapi.Server({
      port: 8000,
    });
    server = new hapi.Server({
      port: 9000,
      debug: {
        log: ['*', 'hapi-req']
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
  lab.afterEach(async() => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('verbose mode prints out timing and status code info', { timeout: 10000 }, async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(100);
        return {};
      }
    });
    const logs = [];
    server.events.on('log', event => {
      logs.push(event.data);
    });
    await server.req.get('http://localhost:8000/literal', {});
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2000);
    const data = logs[0];
    code.expect(Object.keys(data)).to.equal(['url', 'statusCode', 'duration']);
    code.expect(typeof data.duration).to.equal('number');
    code.expect(data.duration).to.be.greaterThan(99);
  });
});

lab.experiment('remote settings', (allDone) => {
  let testServer;
  let server;

  lab.beforeEach(async() => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({ port: 9000 });
    await server.register({
      plugin: hapiReq,
      options: {
        timeout: 7000
      }
    });
    await testServer.start();
    await server.start();
  });
  lab.afterEach(async() => {
    await testServer.stop();
    await server.stop();
  });

  lab.test('can set timeout option', { timeout: 10000 }, async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(6000);
        return {};
      }
    });
    await server.req.get('http://localhost:8000/literal', {});
  });

  lab.test('timeout after 5 seconds by default', { timeout: 10000 }, async () => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(7100);
        return {};
      }
    });
    try {
      await server.req.get('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('support option to get back response object', async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: (request, h) => ({ result: true })
    });
    const result = await server.req.get('http://localhost:8000/literal', { returnResponse: true });
    code.expect(result).to.not.equal(null);
    code.expect(result.result.statusCode).to.equal(200);
    code.expect(result.result.headers).to.not.equal(null);
    code.expect(result.payload.result).to.equal(true);
  });

  lab.test('support option to turn off json response', async() => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: (request, h) => 'not json'
    });
    // when json option is true, wreck will return the string if it cannot parse it as JSON:
    const result1 = await server.req.get('http://localhost:8000/literal', { json: true });
    code.expect(result1.toString()).to.equal('not json');
  });
});

lab.experiment('remote', (allDone) => {
  let testServer;
  let server;

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

  lab.test('gets successfully', async () => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('http://localhost:8000/literal', {});
    code.expect(result.f).to.equal('true');
  });

  lab.test('get failures are handled', async () => {
    try {
      await server.req.get('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
      code.expect(err.message).to.equal('Response Error: 404 Not Found');
    }
  });

  lab.test('get failures are handled', async () => {
    try {
      await server.req.get('http://localhost:8001/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
      code.expect(err.toString()).to.equal('Error: Client request error: connect ECONNREFUSED 127.0.0.1:8001');
    }
  });

  lab.test('constructs headers from header args correctly', async () => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler(request, h) {
        return { result: request.headers.mine };
      }
    });
    code.expect(server.req.get).to.exist();
    const result = await server.req.get('http://localhost:8000/literal', { headers: { mine: 'header' } });
    code.expect(result.result).to.equal('header');
  });

  lab.test('post successfully', async() => {
    testServer.route({
      path: '/literal',
      method: 'post',
      handler(request, h) {
        return request.payload;
      }
    });
    code.expect(server.req.post).to.exist();
    await server.req.post('http://localhost:8000/literal', { payload: { f: 'true' } });
  });

  lab.test('post failures are handled', async() => {
    try {
      await server.req.post('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('put successfully', async() => {
    testServer.route({
      path: '/literal',
      method: 'put',
      handler(request, h) {
        return { result: 'hi' };
      }
    });
    code.expect(server.req.put).to.exist();
    const result = await server.req.put('http://localhost:8000/literal', { payload: { f: 'true' } });
    code.expect(result.result).to.equal('hi');
  });

  lab.test('put failures are handled', async () => {
    try {
      await server.req.put('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('patch successfully', async() => {
    testServer.route({
      path: '/literal',
      method: 'patch',
      handler(request, h) {
        return request.payload;
      }
    });
    code.expect(server.req.patch).to.exist();
    await server.req.patch('http://localhost:8000/literal', { payload: { f: 'true' } });
  });

  lab.test('patch failures are handled', async() => {
    try {
      await server.req.patch('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('deletes successfully', async () => {
    testServer.route({
      path: '/literal',
      method: 'delete',
      handler(request, h) {
        return { f: 'true' };
      }
    });
    code.expect(server.req.delete).to.exist();
    await server.req.delete('http://localhost:8000/literal', {});
  });

  lab.test('delete failures are handled', async () => {
    try {
      await server.req.delete('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });

  lab.test('timeout after 5 seconds by default', { timeout: 10000 }, async () => {
    testServer.route({
      path: '/literal',
      method: 'get',
      handler: async(request, h) => {
        // wrap setTimeout
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(6000);
      }
    });
    try {
      await server.req.get('http://localhost:8000/literal', {});
    } catch (err) {
      code.expect(err).to.not.equal(null);
    }
  });
});

lab.experiment('request', (allDone) => {
  let testServer;
  let server;

  lab.beforeEach(async () => {
    testServer = new hapi.Server({ port: 8000 });
    server = new hapi.Server({ port: 9000 });
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

  lab.test('can be called from the request', async () => {
    server.route({
      path: '/request',
      method: 'get',
      handler(request, h) {
        return request.req.get('http://localhost:8000/literal', {});
      }
    });
    testServer.route({
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
        return request.req.get('http://localhost:8000/literal');
      }
    });
    testServer.route({
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
      url: 'http://localhost:8000/literal',
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
        const result = await request.req.get('http://localhost:8000/literal', {});
        code.expect(typeof request.plugins['hapi-timing']['hapi-req']).to.equal('number');
        return result;
      }
    });
    testServer.route({
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
