
# lru-pcache

An LRU cache for promises. Developer friendly

## Features

 - Promisification: Async ready to easily change to a memcached/redis implementation
 - Improved get method, to make more expressive usage of the pattern "if not found
 in the cache, go get it, store in the cache, and return the value"
 - Funnel values: Promises are stored and returned, so if the value for a key
 is being obtained while another get is requested, the promise of the value is returned
 so only one request for value is done
 - Compatible with non-promises methods

>  100% coverage

## Basic Usage
```sh
npm install lru-pcache
```

```js
const { Cache } = require('lru-pcache');

const cache = new Cache({ // see https://github.com/isaacs/node-lru-cache#options for options
  max: 50, // # of items
  maxAge: 10 * 60 * 1000, // expiration in ms (10 min)
});

// The old method without cache
const getCarUncached = async (name) => {
  const { data } = await axios.get(`https://example.com/cars/${name}`);
  return data;
});

// With cache: easy addinng
const getCar = async (name) => cache.get(name, async () => {
  const { data } = await axios.get(`https://example.com/cars/${name}`);
  return data;
});

await volvo = await getCar('Volvo');
await cache.del('Volvo'); // delete from cache
await cache.reset(); // clear cache
```

## Development setup

To clone the repository use the following commands:

```sh
git clone https://github.com/jmendiara/lru-pcache && cd lru-pcache
```

Use [VSCode development containers](https://code.visualstudio.com/docs/remote/containers),  directly [docker-compose](https://docs.docker.com/compose/)

```sh
# Shell interactive session inside a container
docker-compose run app bash
```

### Available Scripts

- `clean` - remove coverage data, Jest cache and transpiled files,
- `build` - transpile TypeScript to ES6,
- `watch` - interactive watch mode to automatically transpile source files,
- `lint` - lint source files and tests,
- `test` - run tests,
- `test:watch` - interactive watch mode to automatically re-run tests
- `format` - format the code

## License

Copyright 2020 Javier Mendiara Cañardo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
