export default class Logger {
  child () {
    return this;
  }
}

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
for (const level of levels) {
  Logger.prototype[level] = function log (...args) {
    const {console} = global;
    const log = (level in console) ? console[level] : console.log;
    return log.call(console, ...args);
  };
}
