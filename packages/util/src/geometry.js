export function euclideanDistance (p1, p2) {
  if (p1.length !== p2.length) {
    throw new Error('Points must be of same dimension')
  }

  let sum = 0
  for (let i = 0; i < p1.length; i++) {
    const diff = p2[i] - p1[i]
    sum += Math.pow(diff, 2)
  }

  return Math.sqrt(sum)
}