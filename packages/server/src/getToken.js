export default function getToken (request) {
  const header = request.get('Authorization');
  const prefix = /^Bearer /;
  if (header && header.match(prefix)) {
    return header.replace(prefix, '');
  } else {
    return null;
  }
}
