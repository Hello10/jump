(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@hello10/util'), require('type-of-is'), require('lodash'), require('email-regex'), require('phone-regex')) :
  typeof define === 'function' && define.amd ? define(['exports', '@hello10/util', 'type-of-is', 'lodash', 'email-regex', 'phone-regex'], factory) :
  (global = global || self, factory(global.jumpUtil = {}, global.util, global.Type, global.lodash, global.emailRegex, global.phoneRegex));
}(this, (function (exports, util, Type, lodash, emailRegex, phoneRegex) {
  Type = Type && Object.prototype.hasOwnProperty.call(Type, 'default') ? Type['default'] : Type;
  emailRegex = emailRegex && Object.prototype.hasOwnProperty.call(emailRegex, 'default') ? emailRegex['default'] : emailRegex;
  phoneRegex = phoneRegex && Object.prototype.hasOwnProperty.call(phoneRegex, 'default') ? phoneRegex['default'] : phoneRegex;

  function camelCaseKeys(obj) {
    return lodash.mapKeys(obj, (v, k) => lodash.camelCase(k));
  }

  function compact_(obj) {
    const type = Type(obj);

    switch (type) {
      case Array:
        return lodash.compact(obj);

      case Object:
        return lodash.pickBy(obj, lodash.identity);

      case String:
        return obj.replace(/\s+/g, '');

      default:
        throw new Error(`compact does not support type ${type}`);
    }
  }

  function determineAddressType(address) {
    const email = emailRegex({
      exact: true
    });

    if (email.test(address)) {
      return 'email';
    }

    const phone = phoneRegex({
      exact: true
    });

    if (phone.test(address)) {
      return 'phone';
    }

    return null;
  }

  function isValidEmail(email) {
    const regex = emailRegex({
      exact: true
    });
    return regex.test(email);
  }

  function omitTypename(obj) {
    return obj ? lodash.omit(obj, '__typename') : obj;
  }

  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.split('');

  function randomReadableChar() {
    const index = util.randomInt(chars.length - 1);
    return chars[index];
  }

  function readableCode(len) {
    return lodash.times(len, randomReadableChar).join('');
  }

  function setwiseEqual(array1, array2) {
    return lodash.isEqual(lodash.sortBy(array1), lodash.sortBy(array2));
  }

  const suffix_length = 16;
  const prefix = 'person';
  const regex = new RegExp(`^${prefix}\\.[A-Za-z0-9]{${suffix_length}}$`);
  function generateUsername() {
    const suffix = readableCode(suffix_length);
    return `${prefix}.${suffix}`;
  }
  function isGeneratedUsername(username) {
    return username.match(regex);
  }

  Object.keys(util).forEach(function (k) {
    if (k !== 'default') Object.defineProperty(exports, k, {
      enumerable: true,
      get: function () {
        return util[k];
      }
    });
  });
  exports.Type = Type;
  exports.camelCaseKeys = camelCaseKeys;
  exports.compact = compact_;
  exports.determineAddressType = determineAddressType;
  exports.generateUsername = generateUsername;
  exports.isGeneratedUsername = isGeneratedUsername;
  exports.isValidEmail = isValidEmail;
  exports.omitTypename = omitTypename;
  exports.readableCode = readableCode;
  exports.setwiseEqual = setwiseEqual;

})));
//# sourceMappingURL=index.umd.js.map
