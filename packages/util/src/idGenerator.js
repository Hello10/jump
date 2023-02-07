import shortcode from './shortcode'

export function idGenerator ({ suffixLength = 16, prefix = 'person' } = {}) {
  const regex = new RegExp(`^${prefix}\\.[A-Za-z0-9]{${suffixLength}}$`)

  function generateId () {
    const suffix = shortcode({ length: suffixLength })
    return `${prefix}.${suffix}`
  }

  function isGeneratedId (id) {
    return id.match(regex)
  }

  return {
    generateId,
    isGeneratedId
  }
}

export default idGenerator
