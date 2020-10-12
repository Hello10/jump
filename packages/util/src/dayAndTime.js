export default function dayAndTime (date) {
  date = new Date(date);
  const day = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const time = date.toLocaleTimeString();
  return {day, time};
}
