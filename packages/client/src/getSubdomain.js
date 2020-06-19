export default function getSubdomain (hostname) {
  const parts = hostname.split('.');

  let last_index = -2;
  const last = parts[parts.length - 1];
  const is_localhost = last === 'localhost';
  if (is_localhost) {
    last_index = -1;
  }

  return parts.slice(0, last_index).join('.');
}
