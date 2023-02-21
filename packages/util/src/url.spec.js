import assert from 'assert'

import { parseUrlOrPath, parseUrl, parsePath } from './url'

describe('parseUrlOrPath', () => {
  it('parses a url', () => {
    const url = 'https://example.com/foo/bar?baz=qux'
    const parsed = parseUrlOrPath(url)
    assert.deepEqual(parsed, parseUrl(url))
  })

  it('parses a path', () => {
    const path = '/foo/bar?baz=qux'
    const parsed = parseUrlOrPath(path)
    assert.deepEqual(parsed, parsePath(path))
  })
})

describe('parseUrl', () => {
  it('parses a url', () => {
    const url = 'https://example.com/foo/bar?baz=qux'
    const parsed = parseUrl(url)
    assert.deepEqual(parsed, new URL(url))
  })
})

describe('parsePath', () => {
  it('parses a path', () => {
    const path = '/foo/bar?baz=qux'
    const parsed = parsePath(path)
    assert.deepEqual(parsed, new URL('http://localhost' + path))
  })
})