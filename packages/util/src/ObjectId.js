/*  eslint-disable no-bitwise */

import { isString, isNumber } from './type'

// Based off:
// https://github.com/mongodb/js-bson/blob/1.0-branch/lib/bson/objectid.js
// https://stackoverflow.com/a/40031979/178043

const MACHINE_ID = parseInt(Math.random() * 0xffffff, 10)

function uint16toHex (arr) {
  return Array.prototype.map.call(arr, (x) => (`00${x.toString(16)}`).slice(-2)).join('')
}

let index = ~~(Math.random() * 0xffffff)
function getInc () {
  index = ((index + 1) % 0xffffff)
  return index
}

export function generateObjectId (time) {
  if (!isNumber(time)) {
    time = ~~(Date.now() / 1000)
  }

  const pid = Math.floor(Math.random() * 100000) % 0xffff

  const inc = getInc()

  // 12 bytes => 24 hex chars
  const id = new Uint8Array(12)

  // Encode time
  id[3] = time & 0xff
  id[2] = (time >> 8) & 0xff
  id[1] = (time >> 16) & 0xff
  id[0] = (time >> 24) & 0xff

  // Encode machine
  id[6] = MACHINE_ID & 0xff
  id[5] = (MACHINE_ID >> 8) & 0xff
  id[4] = (MACHINE_ID >> 16) & 0xff

  // Encode pid
  id[8] = pid & 0xff
  id[7] = (pid >> 8) & 0xff

  // Encode index
  id[11] = inc & 0xff
  id[10] = (inc >> 8) & 0xff
  id[9] = (inc >> 16) & 0xff

  return uint16toHex(id)
}

export const ObjectIdRegex = /^[0-9a-fA-F]{24}$/

export function isObjectId (obj) {
  if (!isString(obj)) {
    if (obj?.toString) {
      obj = obj.toString()
    } else {
      return false
    }
  }
  return obj.match(ObjectIdRegex)
}
