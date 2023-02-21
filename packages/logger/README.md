# Logger
![](/logger.jpg)

## What?
Log json in an easily consumable and readable format.

## Why?
You want visibility across both applications and their dependencies easily configured using environment variables, with messsage filtering/addressability based on both logger name and level in order avoid having to do [this](https://github.com/trentm/node-bunyan#level-suggestions). Based on parts of [bunyan](https://github.com/trentm/node-bunyan) and [debug](https://github.com/visionmedia/debug).

## Example

```JavaScript
// LOGGER="foo:bar*|error,ping:pong|info,-ping:pong:pork" node example.js

import Logger from '@hello10/logger';

// Create a logger
let logger = new Logger({name: 'foo', something: 'wow'});
logger.trace('hi'); // Ignored: name fails to match and level too low

// Create a child logger
logger = logger.child({name: 'bar'});
logger.info('wow'); // Ignored: name matches but level is too low
logger.error('oh no'); // Shown

// Create another logger
let logger2 = new Logger({name: 'ping:pong', funk: 'derp'});
logger2.debug('derp'); // Ignored: name matches but level is too low
logger2.error(new Error('dorf')); // Shown

// Create child using name shorthand
logger2 = logger2.child('pork');
logger2.fatal('bork'); // Ignored: name is excluded

```

### Output
```
oh no { name: 'foo:bar',
  something: 'wow',
  message: 'oh no',
  time: '2020-07-03T00:51:22.975Z' }
dorf { name: 'ping:pong',
  funk: 'derp',
  message: 'dorf',
  error:
   '{"stack":"Error: dorf ...<STACKTRACE HERE>","message":"dorf"}',
  time: '2020-07-03T00:51:22.985Z' }
```

## Todo
- Add configured payload serializers (i.e. `error`, `request`, `response`)
- Allow configurability for fixed keys i.e . `time`, `error` and `message` so people can use `ts`, `err`, `msg` etc.
- Allow for not logging the message as prefix
