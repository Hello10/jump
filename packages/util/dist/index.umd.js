(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@hello10/util'), require('type-of-is'), require('lodash'), require('email-regex'), require('phone-regex'), require('url-regex-safe')) :
  typeof define === 'function' && define.amd ? define(['exports', '@hello10/util', 'type-of-is', 'lodash', 'email-regex', 'phone-regex', 'url-regex-safe'], factory) :
  (global = global || self, factory(global.jumpUtil = {}, global.util, global.typeOfIs, global.lodash, global.emailRegex, global.phoneRegex, global.urlRegexSafe));
}(this, (function (exports, util, Type, lodash, emailRegex, phoneRegex, UrlRegex) {
  Type = Type && Object.prototype.hasOwnProperty.call(Type, 'default') ? Type['default'] : Type;
  emailRegex = emailRegex && Object.prototype.hasOwnProperty.call(emailRegex, 'default') ? emailRegex['default'] : emailRegex;
  phoneRegex = phoneRegex && Object.prototype.hasOwnProperty.call(phoneRegex, 'default') ? phoneRegex['default'] : phoneRegex;
  UrlRegex = UrlRegex && Object.prototype.hasOwnProperty.call(UrlRegex, 'default') ? UrlRegex['default'] : UrlRegex;

  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.split('');

  function randomReadableChar() {
    const index = util.randomInt(chars.length - 1);
    return chars[index];
  }

  function readableCode(len) {
    return lodash.times(len, randomReadableChar).join('');
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

  function dayAndTime(date) {
    date = new Date(date);
    const day = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = date.toLocaleTimeString();
    return {
      day,
      time
    };
  }

  function isValidEmail(email) {
    const regex = emailRegex({
      exact: true
    });
    return regex.test(email);
  }

  function isValidPhoneNumber(number) {
    const regex = phoneRegex({
      exact: true
    });
    return regex.test(number);
  }

  function determineAddressType(address) {
    if (isValidEmail(address)) {
      return 'email';
    }

    if (isValidPhoneNumber(address)) {
      return 'phone';
    }

    return null;
  }

  /*  eslint-disable no-bitwise */
  // Based off:
  // https://github.com/mongodb/js-bson/blob/1.0-branch/lib/bson/objectid.js
  // https://stackoverflow.com/a/40031979/178043
  const MACHINE_ID = parseInt(Math.random() * 0xffffff, 10);

  function uint16toHex(arr) {
    return Array.prototype.map.call(arr, x => `00${x.toString(16)}`.slice(-2)).join('');
  }

  let index = ~~(Math.random() * 0xffffff);

  function getInc() {
    index = (index + 1) % 0xffffff;
    return index;
  }

  function generateObjectID(time) {
    if (typeof time !== 'number') {
      time = ~~(Date.now() / 1000);
    }

    const pid = Math.floor(Math.random() * 100000) % 0xffff;
    const inc = getInc(); // 12 bytes => 24 hex chars

    const id = new Uint8Array(12); // Encode time

    id[3] = time & 0xff;
    id[2] = time >> 8 & 0xff;
    id[1] = time >> 16 & 0xff;
    id[0] = time >> 24 & 0xff; // Encode machine

    id[6] = MACHINE_ID & 0xff;
    id[5] = MACHINE_ID >> 8 & 0xff;
    id[4] = MACHINE_ID >> 16 & 0xff; // Encode pid

    id[8] = pid & 0xff;
    id[7] = pid >> 8 & 0xff; // Encode index

    id[11] = inc & 0xff;
    id[10] = inc >> 8 & 0xff;
    id[9] = inc >> 16 & 0xff;
    return uint16toHex(id);
  }

  const regex$1 = UrlRegex({
    exact: true
  });

  function omitTypename(obj) {
    return obj ? lodash.omit(obj, '__typename') : obj;
  }

  function pluralize({
    count,
    singular,
    plural
  }) {
    if (!plural) {
      plural = `${singular}s`;
    }

    return count === 1 ? `a ${singular}` : `${count} ${plural}`;
  }

  function setwiseEqual(array1, array2) {
    return lodash.isEqual(lodash.sortBy(array1), lodash.sortBy(array2));
  }

  const BASE_PATH = 'https://firebasestorage.googleapis.com/v0/b';
  function storageDownloadUrl({
    bucket,
    key
  }) {
    key = key.replace(/^\//, '');
    key = encodeURIComponent(key);
    return `${BASE_PATH}/${bucket}/o/${key}?alt=media`;
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
  exports.dayAndTime = dayAndTime;
  exports.determineAddressType = determineAddressType;
  exports.generateObjectID = generateObjectID;
  exports.generateUsername = generateUsername;
  exports.isGeneratedUsername = isGeneratedUsername;
  exports.isUrl = regex$1;
  exports.isValidEmail = isValidEmail;
  exports.isValidPhoneNumber = isValidPhoneNumber;
  exports.omitTypename = omitTypename;
  exports.pluralize = pluralize;
  exports.readableCode = readableCode;
  exports.setwiseEqual = setwiseEqual;
  exports.storageDownloadUrl = storageDownloadUrl;

})));
//# sourceMappingURL=index.umd.js.map
