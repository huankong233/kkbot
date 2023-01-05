export default () => {
  return {
    globalReg
  }
}

export const globalReg = obj => Object.assign(global, obj)
