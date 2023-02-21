// LOGGER="foo:bar*|error,ping:pong|info,-ping:pong:pork" node example.js

import Logger from './dist';

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
