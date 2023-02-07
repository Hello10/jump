import defined from './defined'
import interval from './interval'
import { isNumber } from './type'

const { MIN_VALUE } = Number

export function clipper (args) {
  const { lt, lte, gt, gte } = interval(args)

  return function constrain (value) {
    if (!isNumber(value)) {
      throw new Error('Invalid non-numeric value')
    }

    if (defined(gt) && (value <= gt)) {
      return gt + MIN_VALUE
    }
    if (defined(gte) && (value < gte)) {
      return gte
    }
    if (defined(lt) && (value >= lt)) {
      return lt - MIN_VALUE
    }
    if (defined(lte) && (value > lte)) {
      return lte
    }
    return value
  }
}

export default clipper
