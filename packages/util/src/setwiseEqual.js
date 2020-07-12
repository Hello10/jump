import {
  isEqual,
  sortBy
} from 'lodash';

export default function setwiseEqual (array1, array2) {
  return isEqual(sortBy(array1), sortBy(array2));
}
