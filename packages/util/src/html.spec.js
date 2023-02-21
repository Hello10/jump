import assert from 'assert'

import {
  a,
  image,
  span,
  input,
  div,
  stripTags,
  escapeHtml
} from './html'

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
  it('should strip tags ', () => {
    const actual = stripTags('<div><br/>hi<br/></div>')
    const expected = 'hi'
    assert.equal(actual, expected)
  })

  it('should skip specific tags ', () => {
    const actual = stripTags({
      text: '<div><br />hi<br></div>',
      skip: ['br']
    })
    const expected = '<br />hi<br>'
    assert.equal(actual, expected)
  })

  it('should error on bad input', ()=> {
    assert.throws(() => stripTags(1))
    assert.throws(() => stripTags({}))
  })
})

describe('escapeHtml', () => {
  it('should escape html', () => {
    const actual = escapeHtml('<div><br/>hi<br/></div>')
    const expected = '&lt;div&gt;&lt;br&#x2F;&gt;hi&lt;br&#x2F;&gt;&lt;&#x2F;div&gt;'
    assert.equal(actual, expected)
  })

  it('should skip specific entities', () => {
    const actual = escapeHtml({
      text: 'wow <derp>&"huh"',
      skip: ['&', '"']
    })
    const expected = 'wow &lt;derp&gt;&"huh"'
    assert.equal(actual, expected)
  })

  it('should error on bad input', ()=> {
    assert.throws(() => escapeHtml(1))
    assert.throws(() => escapeHtml({}))
  })
})