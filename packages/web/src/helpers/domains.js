export function getSubdomain (hostname) {
  const parts = hostname.split('.')
  const last = parts[parts.length - 1]
  const isLocalhost = last === 'localhost'
  const lastIndex = isLocalhost ? -1 : -2
  return parts.slice(0, lastIndex).join('.')
}

export function makeGetSubdomainApp (map) {
  const main = map.find((item) => item.main)
  if (!main) {
    throw new Error('Must set main flag to true on at least one subdomain app')
  }

  return function getSubdomainApp (hostname) {
    const subdomain = getSubdomain(hostname)

    if (!subdomain.length) {
      return main.app
    }

    const match = map.find(({ subdomains }) => subdomains.includes(subdomain))

    if (match) {
      return match.app
    } else {
      return main.app
    }
  }
}
