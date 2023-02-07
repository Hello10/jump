import assert from 'assert'

import omitTypename from './omitTypename'

describe('omitTypename', () => {
  it('should remove the typename', () => {
    const output = omitTypename({
      id: 123,
      name: 'foo',
      __typename: 'Foo'
    })

    assert.deepEqual(output, {
      id: 123,
      name: 'foo'
    })
  })
})
