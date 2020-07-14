export default function getToken (request) {
  if (!request) {
    return null;
  }
  const header = request.get('Authorization');
  const prefix = /^Bearer /;
  if (header && header.match(prefix)) {
    return header.replace(prefix, '');
  } else {
    return null;
  }
}
