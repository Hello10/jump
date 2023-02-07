import assert from 'assert'

import sleep from './sleep'

describe('sleep', () => {
  function ms () {
    const now = new Date()
    return now.getTime()
  }

  it('should sleep', async () => {
    const start = ms()
    const time = 25
    await sleep(time)
    const delta = ms() - start
    assert((delta > time) && (delta < (time * 10)))
  })
})
