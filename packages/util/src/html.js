import { isString, isFunction } from './type'
import { classes } from './classes'

export function html (tag) {
  return (attrs = {}) => {
    const hasAttrs = attrs.constructor === Object

    function render (...children) {
      const content = children.flat().map((child) => {
        if (isFunction(child)) {
          child = child()
        }
        return child
      }).join('')

      let open
      if (hasAttrs) {
        const attrStr = Object.entries(attrs).reduce((result, [k, v]) => {
          // TODO: support style
          if (k === 'class' && !isString(v)) {
            v = classes(v)
          }
          return `${result} ${k}="${v}"`
        }, '')
        open = `${tag}${attrStr}`.trim()
      } else {
        open = tag
      }

      return content ? `<${open}>${content}</${tag}>` : `<${open}/>`
    }

    if (hasAttrs) {
      return render
    } else {
      return render(attrs)
    }
  }
}

export const div = html('div')
export const span = html('span')
export const input = html('input')
export const image = html('image')
export const a = html('a')

export function stripTags(str) {
  return str.replace(/(<([^>]+)>)/gi, '')
}
