import assert from 'assert'

import idGenerator from './idGenerator'

describe('idGenerator', () => {
  it('should generate and detect identifiers', () => {
    const {
      generateId,
      isGeneratedId
    } = idGenerator()

    const id = generateId()
    assert(id)
    assert(isGeneratedId(id))

    assert(!isGeneratedId('foo'))
  })
})
