export function isEmail (str) {
  const regex = emailRegex()
  return regex.test(str)
}

export function isPhone (str) {
  const regex = phoneRegex()
  return regex.test(str)
}

export function emailRegex ({ exact = true } = {}) {
  const regex = '[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*'
  return makeRegex({ exact, regex })
}

export function phoneRegex ({ exact = true } = {}) {
  const regex = '(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?'
  return makeRegex({ exact, regex })
}

function makeRegex ({ regex, exact }) {
  return exact ? new RegExp(`^${regex}$`) : new RegExp(regex, 'g')
}
