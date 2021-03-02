# hapi-req

hapi-req is a [hapi](https://hapi.dev/) plugin that simplifies making
both local and remote HTTP requests. Under the hood hapi-req uses [wreck](https://hapi.dev/module/wreck/).

## Installation

```console
npm install hapi-req
```

## Usage

Register the plugin with hapi:
```js
await server.register({
  plugin: require('hapi-req'),
  options: {}
});
```

To do a simple GET:

```js
const payload = await server.req.get('https://zombo.com', {
  headers: {
    user-agent: 'a-headless-browser'
  }
});
console.log(payload);
/*
<!DOCTYPE html PUBLIC ...
*/
```

By default hapi-req directly returns the _payload_ for a request (the part that you're usually most interested in anyway), but you can get the underlying result object if you want:

```js
const response = await server.req.get('https://zombo.com', {
  returnResponse: true,
  headers: {
    user-agent: 'a-headless-browser'
  }
});
console.log(response);
/*
{ result: {
    statusCode: 200,
    headers: {
      'content-length': 1714
      'content-type': 'text/html;'
      ...
  },
  payload: "<!DOCTYPE html PUBLIC ..."
}
*/
```

hapi-req also supports HTTP GET, POST, PUT, DELETE and PATCH:

```js
await server.req.post('https://zombo.com', {
  payload: {
    login: 'myName',
    password: '1234'
  }
});
```

You can also do local requests to the host server using hapi's [_inject_](https://hapi.dev/api/?v=20.1.0#-await-serverinjectoptions) feature by passing the desired pathname:

```js
testServer.route({
  path: '/aLocalRoute',
  method: 'get',
  handler: (request, h) => ({ hello: "world" })
});
const payload = await server.req.get('/aLocalRoute', {});
console.log(payload);
/*
{ hello: "world" }
*/
```

## Plugin Options

- __query__

  You pass a query to hapi-req in the normal way (adding a '_?field1=val1&field2=val2_' to the URL you are calling).  But you can also specify a default query in object form that will be appended to every request you make. This comes in handy when your local server has an api key or token for authorizing all incoming requests.

  For example:

  ```js
  await server.register({
    plugin: require('hapi-req'),
    options: {
      query: {
        token: '12345'
      }
    }
  });

  await server.req.get('/someRoute?foo=bar');
  ```

  Will result in hapi-req making a GET request to _/someRoute?foo=bar&token=12345_ on the local server.

- __localPrefix__

  Set this to have hapi-req add the indicated prefix to every local URL request. So

  ```js
  await server.register({
    plugin: require('hapi-req'),
    options: {
      localPrefix: '/api'
    }
  });

  await server.req.get('/login');
  ```

  will result in hapi-req making a request to _/api/login_/.  This only works for local requests, requests to remote servers are not affected.  Default is false.

- __maxRetries__

  When an HTTP request times out, you can have hapi-req go ahead and retry the request until the server responds. _maxRetries_ specifies the number of times hapi-req will retry a request before giving up and throwing an error response.  Default is 0.

- __slowWarningRemote__

  You can tell hapi-req to print out some timing info with _server.log_
  any time a remote request takes too long to respond. Just set _slowWarningRemote_ to the number of milliseconds you consider 'delayed', any request that takes longer to complete will be logged. Default is false, so you must set _slowWarningRemote_ to a value if you want hapi-req to log slow response times.

- __slowWarningLocal__

  Same as _slowWarningRemote_, except this applies only to requests made to the local server (i.e. you can log delayed responses from your local server while ignoring delayed responses from remote servers).  Default is false, you must set _slowWarningLocal_ to a value if you want to see logging info for slow responses.

- __json__

  This is passed to wreck's _json_ parameter.  Valid values are:
  - _false_ (always returns raw payload)
  - _true_ (only returns JSON if the content-type is JSON)
  - _"strict"_ (returns JSON if the content-type is JSON but returns an error if the result is not JSON)
  - _"force"_ (always presumes the response is JSON).

  Default in hapi-req is 'force'.

- __logErrors__

  When true, hapi-req will automatically log request errors (in addition to throwing the error for you to process).  Otherwise hapi-req will just throw the error and you can handle logging it yourself.  Default is false.
