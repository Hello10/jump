import { randomInt } from '@hello10/util';
export * from '@hello10/util';
import { mapKeys, camelCase, pickBy, identity, compact, times, isEqual, sortBy } from 'lodash';
import Type from 'type-of-is';
import emailRegex from 'email-regex';
import phoneRegex from 'phone-regex';

function camelCaseKeys(obj) {
  return mapKeys(obj, (v, k) => camelCase(k));
}

function compact_(obj) {
  const type = Type(obj);

  switch (type) {
    case Array:
      return compact(obj);

    case Object:
      return pickBy(obj, identity);

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

const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.split('');

function randomReadableChar() {
  const index = randomInt(chars.length - 1);
  return chars[index];
}

function readableCode(len) {
  return times(len, randomReadableChar).join('');
}

function setwiseEqual(array1, array2) {
  return isEqual(sortBy(array1), sortBy(array2));
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

export { camelCaseKeys, compact_ as compact, determineAddressType, generateUsername, isGeneratedUsername, isValidEmail, readableCode, setwiseEqual };
//# sourceMappingURL=index.modern.js.map
