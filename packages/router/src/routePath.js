export function routePath(pattern) {
  const wildcardPrefix = 'WILDCARD_'

  const namedParams = []

  // convert path string that can contain
  // /path/with/:namedParam
  // /path/with/:optionalNamedParam?
  // /path/with/optionalStaticParam?
  // /path/with/*namedWildcard
  // /path/with/*

  const regexStr = pattern.split('/').map((part, index) => {
    const optional = part[part.length - 1] === '?'
    const name = (optional ? part.slice(1, -1) : part.slice(1)).trim()

    if (part === '') {
      return ''
    } else if (part[0] === '*') {
      const groupName = name.length ? name : `${wildcardPrefix}${index}`
      if (name) {
        namedParams.push({ name, optional: true })
      }
      return `/(?<${groupName}>.*)`
    } else if (part[0] === ':') {
      namedParams.push({ name, optional })
      return optional ? `(/(?<${name}>[^/]+))?` : `/(?<${name}>[^/]+)`
    } else {
      return optional ? `(/${part})?` : `/${part}`
    }
  }).join('')

  const regex = new RegExp(regexStr ? `^${regexStr}$` :  '^/$')

  const hasNamedParams = namedParams.length > 0

  function match (pathname) {
    const match = regex.exec(pathname)
    if (!match) {
      return null
    } else {
      const groups = match.groups ?? {}
      return Object.entries(groups).reduce((acc, [key, value]) => {
        if (key.startsWith(wildcardPrefix)) {
          return {
            ...acc,
            wildcards: [...acc.wildcards ?? [], value]
          }
        } else {
          return {
            ...acc,
            [key]: value === undefined ? value : decodeURIComponent(value)
          }
        }
      }, {})
    }
  }

  function build (params = {}) {
    const paramNames = namedParams.map((np) => np.name)

    const patternWithoutOptionalStatic = pattern.replace(/\/[^:/]+\?$/, '')
    return patternWithoutOptionalStatic.replace(regex, (...args)=> {
      const groups = hasNamedParams ? args[args.length - 1] : []
      return paramNames.reduce((res, name) => {
        const groupName = groups[name]
        let value = params[name]
        if (value) {
          value = encodeURIComponent(value)
          return res.replace(groupName, value)
        } else {
          return res.replace(`/${groupName}`, '')
        }
      }, patternWithoutOptionalStatic)
    })
  }

  return { match, build, namedParams }
}

export default routePath
