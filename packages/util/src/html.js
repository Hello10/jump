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

export function tagStripper({ skip = [] } = {}) {
  return (text) => {
    const skipRegexes = skip.map(tag => new RegExp(`<\/?${tag}[^>]*>`))
    const htmlTagsRegex = /<\/?[a-z][\s\S]*?>/gi;
    const escapedHtml = text.replace(htmlTagsRegex, tag => {
      if (skipRegexes.some(re => tag.match(re))) {
        return tag;
      } else {
        return '';
      }
    });
    return escapedHtml;
  }
}

export function stripTags(args) {
  const { text, ...rest } = getTextArgs(args)
  return tagStripper(rest)(text)
}

export function htmlEscaper ({ skip = [] }) {
  return (text) => {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    }

    return String(text).replace(/[&<>"'/]/g, (s) => {
      const shouldSkip = (skip.indexOf(s) !== -1)
      return shouldSkip ? s : entityMap[s]
    })
  }
}

export function escapeHtml (args) {
  const { text, ...rest } = getTextArgs(args)
  return htmlEscaper(rest)(text)
}

function getTextArgs(args) {
  if (isString(args)) {
    args = { text: args }
  }
  if (!('text' in args)) {
    throw new Error('Missing text argument')
  }
  if (!args.skip) {
    args.skip = []
  }
  return args
}

