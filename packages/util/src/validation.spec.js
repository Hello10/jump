import assert from 'assert'

import {
  isPhone,
  isEmail,
  phoneRegex,
  emailRegex
} from './validation'

describe('isPhone', () => {
  it('should return true for valid phone', () => {
    assert(isPhone('6507897899'))
  })

  it('should return false for invalid phone', () => {
    assert(!isPhone('123'))
  })
})

describe('isEmail', () => {
  it('should return true for valid email', () => {
    assert(isEmail('name@email.com'))
  })

  it('should return false for invalid email', () => {
    assert(!isEmail('name'))
  })
})

describe('phoneRegex', () => {
  it('should return a phone regex that is inexact', () => {
    const regex = phoneRegex({ exact: false })
    let match = regex.test('   wow 6507897899  ok ')
    assert(match)
    match = regex.test(' fooo ')
    assert(!match)
  })

  it('should return a phone regex that is exact', () => {
    const regex = phoneRegex({ exact: true })
    let match = regex.test('6507897899')
    assert(match)
    match = regex.test('fooo')
    assert(!match)
  })
})

describe('emailRegex', () => {
  it('should return an email regex that is inexact', () => {
    const regex = emailRegex({ exact: false })
    let match = regex.test('   wow email@email.com  ok ')
    assert(match)
    match = regex.test(' email.com ')
    assert(!match)
  })

  it('should return an email regex that is inexact', () => {
    const regex = emailRegex({ exact: true })
    let match = regex.test('email@email.com')
    assert(match)
    match = regex.test('email.com')
    assert(!match)
  })
})
