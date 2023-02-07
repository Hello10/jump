import interval from './interval'
import defined from './defined'

export function betweener (arg) {
  const { lt, lte, gt, gte } = interval(arg)

  return function between (value) {
    if (defined(gt) && (value <= gt)) {
      return false
    }
    if (defined(gte) && (value < gte)) {
      return false
    }
    if (defined(lt) && (value >= lt)) {
      return false
    }
    if (defined(lte) && (value > lte)) {
      return false
    }
    return true
  }
}