export const humanNum = num => (num < 10000 ? num : `${(num / 10000).toFixed(1)}万`)
