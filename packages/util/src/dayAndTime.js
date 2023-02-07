export function dayAndTime (date) {
  date = new Date(date)
  const day = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const time = date.toLocaleTimeString('en-US')
  return { day, time }
}

export default dayAndTime
