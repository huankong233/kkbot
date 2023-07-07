/**
 * 代码来自https://github.com/Tsuk1ko/cq-picsearcher-bot
 */

import Jimp from 'jimp'

export const rotate90degrees = (bitmap, dstBuffer, clockwise) => {
  const dstOffsetStep = clockwise ? -4 : 4
  let dstOffset = clockwise ? dstBuffer.length - 4 : 0

  let tmp
  let x
  let y
  let srcOffset

  for (x = 0; x < bitmap.width; x++) {
    for (y = bitmap.height - 1; y >= 0; y--) {
      srcOffset = (bitmap.width * y + x) << 2
      tmp = bitmap.data.readUInt32BE(srcOffset, true)
      dstBuffer.writeUInt32BE(tmp, dstOffset, true)
      dstOffset += dstOffsetStep
    }
  }
}

/**
 * Rotates an image clockwise by a number of degrees rounded to the nearest 90 degrees.
 * @param {number} deg the number of degrees to rotate the image by
 */
Jimp.prototype.simpleRotate = function (deg) {
  let steps = Math.round(deg / 90) % 4
  steps += steps < 0 ? 4 : 0

  if (steps === 0) return

  const srcBuffer = this.bitmap.data
  const len = srcBuffer.length
  const dstBuffer = Buffer.allocUnsafe(len)

  let tmp

  if (steps === 2) {
    for (let srcOffset = 0; srcOffset < len; srcOffset += 4) {
      tmp = srcBuffer.readUInt32BE(srcOffset, true)
      dstBuffer.writeUInt32BE(tmp, len - srcOffset - 4, true)
    }
  } else {
    rotate90degrees(this.bitmap, dstBuffer, steps === 1)

    tmp = this.bitmap.width
    this.bitmap.width = this.bitmap.height
    this.bitmap.height = tmp
  }

  this.bitmap.data = dstBuffer

  return this
}

/**
 * 图片反和谐处理
 * @param {Buffer} image
 * @param {number} mode
 * @returns base64
 */
export const imgAntiShielding = async (image, mode) => {
  const img = await Jimp.read(Buffer.from(image))
  let rotate = [90, -90, 180, -180]
  if (mode === 1) {
    randomModifyPixels(img)
  } else if (mode === 2) {
    img.simpleRotate(rotate[parseInt(Math.random() * rotate.length)])
  } else if (mode === 3) {
    randomModifyPixels(img)
    img.simpleRotate(rotate[parseInt(Math.random() * rotate.length)])
    randomModifyPixels(img)
  } else if (mode === 4) {
    randomModifyPixels(img)
    randomModifyPixels(img)
    randomModifyPixels(img)
    randomModifyPixels(img)
  } else {
    throw new Error('你别乱写啊(')
  }

  const base64 = await img.getBase64Async(Jimp.AUTO)
  return base64.split(',')[1]
}

/**
 * 随机修改四角像素
 * @param {Jimp} img
 */
import { randomInt } from '../../libs/random.js'
export const randomModifyPixels = img => {
  const [w, h] = [img.getWidth(), img.getHeight()]
  const pixels = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1]
  ]
  for (const [x, y] of pixels) {
    img.setPixelColor(
      Jimp.rgbaToInt(randomInt(0, 255), randomInt(0, 255), randomInt(0, 255), 1),
      x,
      y
    )
  }
}
