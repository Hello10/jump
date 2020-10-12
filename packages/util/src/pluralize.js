export default function pluralize ({count, singular, plural}) {
  if (!plural) {
    plural = `${singular}s`;
  }
  return (count === 1) ? `a ${singular}` : `${count} ${plural}`;
}
