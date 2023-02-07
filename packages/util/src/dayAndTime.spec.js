import assert from 'assert'

import dayAndTime from './dayAndTime'

describe('assert', () => {
  it('should take a date and return the day and time', () => {
    const date = new Date('August 20, 2000 23:15:30 GMT+00:00')
    const { day, time } = dayAndTime(date)
    assert.equal(day, 'August 20, 2000')
    assert.equal(time, '4:15:30 PM')
  })
})
