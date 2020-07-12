import {mapKeys, camelCase} from 'lodash';

export default function camelCaseKeys (obj) {
  return mapKeys(obj, (v, k)=> camelCase(k));
}
