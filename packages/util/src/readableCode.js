import {times} from 'lodash';
import {randomInt} from '@hello10/util';

// No 'O' or '0'
const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.split('');

function randomReadableChar () {
  const index = randomInt(chars.length - 1);
  return chars[index];
}

export default function readableCode (len) {
  return times(len, randomReadableChar).join('');
}
