export default function timestampsToDates (obj) {
  const type = obj?.constructor.name;
  switch (type) {
    case 'Array':
      return obj.map(timestampsToDates);
    case 'Object':
      return Object.keys(obj).reduce((result, k)=> {
        result[k] = timestampsToDates(obj[k]);
        return result;
      }, {});
    case 'Timestamp':
      return obj.toDate();
    default:
      return obj;
  }
}
