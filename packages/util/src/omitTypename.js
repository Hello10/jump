import {omit} from 'lodash';

export default function omitTypename (obj) {
  return obj ? omit(obj, '__typename') : obj;
}
