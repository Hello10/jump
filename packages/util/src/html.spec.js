import assert from 'assert'

import { a, image, span, input, div, stripTags } from './html'

describe('html', () => {
  it('should render html', () => {
    const actual =
      div({ class: 'mydiv' })(
        image({ src: 'foo', class: { yes: true, no: false } }),
        span('hi'),
        span(
          a({ href: 'https://example.com', class: ['link', false, null] })(
            'example'
          )
        ),
        input({ name: 'foo', value: 100 }),
        'hey'
      )
    const expected = '<div class="mydiv"><image src="foo" class="yes"/><span>hi</span><span><a href="https://example.com" class="link">example</a></span><input name="foo" value="100"/>hey</div>'
    assert.equal(actual, expected)
  })
})

describe('stripTags', () => {
  it('should strip tags', () => {
    const actual = stripTags('<div><br/>hi<br/></div>')
    const expected = 'hi'
    assert.equal(actual, expected)
  })
})