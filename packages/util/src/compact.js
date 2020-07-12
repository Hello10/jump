import Type from 'type-of-is';
import {
  compact,
  identity,
  pickBy
} from 'lodash';

export default function compact_ (obj) {
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
