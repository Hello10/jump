import assert from 'assert'

import { indexer, indexById } from './indexer'

describe('indexer', () => {
  const input = [
    { name: 'hi', id: 1 },
    { name: 'wow', id: 2 },
    { name: 'ok', id: 3 },
    { name: 'hi', id: 4 }
  ]

  it('should accept string arg', () => {
    const indexByName = indexer('name')
    const output = indexByName(input)
    assert.deepEqual(output, {
      hi: [input[0], input[3]],
      wow: [input[1]],
      ok: [input[2]]
    })
  })

  it('should accept obj arg', () => {
    const indexByNameLast = indexer({
      attr: 'name',
      type: indexer.last
    })
    const output = indexByNameLast(input)
    assert.deepEqual(output, {
      hi: input[3],
      wow: input[1],
      ok: input[2]
    })
  })

  it('should fail on bad type arg', () => {
    assert.throws(() => {
      indexer({
        attr: 'name',
        type: 'derp'
      })
    })
  })
})

describe('indexById', () => {
  it('should index by id', () => {
    const input = [
      { id: 10, name: 'wow' },
      { id: 11, name: 'ok' },
      { id: 12, name: 'honk' },
      { id: 10, name: 'wow2' }
    ]
    const output = indexById(input)
    assert.deepEqual(output, {
      10: input[0],
      11: input[1],
      12: input[2]
    })
  })
})
