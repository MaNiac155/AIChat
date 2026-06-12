export const MAX_IMAGE_WIDTH = 768
export const MAX_IMAGE_HEIGHT = 768
export const MAX_IMAGE_BYTES = 500 * 1024
export const CAPTURE_IMAGE_TYPE = 'image/jpeg'

const MIN_IMAGE_QUALITY = 0.45
const QUALITY_STEP = 0.1

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('无法生成截图，请重试'))
      },
      type,
      quality,
    )
  })
}

function getScaledDimensions(width, height) {
  const scale = Math.min(
    1,
    MAX_IMAGE_WIDTH / width,
    MAX_IMAGE_HEIGHT / height,
  )

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function captureVideoFrame(videoElement) {
  if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
    throw new Error('请先开启摄像头')
  }

  const dimensions = getScaledDimensions(
    videoElement.videoWidth,
    videoElement.videoHeight,
  )
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('当前浏览器无法处理截图')
  }

  context.drawImage(videoElement, 0, 0, dimensions.width, dimensions.height)

  let quality = 0.85
  let blob = await canvasToBlob(canvas, CAPTURE_IMAGE_TYPE, quality)

  while (blob.size > MAX_IMAGE_BYTES && quality > MIN_IMAGE_QUALITY) {
    quality = Math.max(MIN_IMAGE_QUALITY, quality - QUALITY_STEP)
    blob = await canvasToBlob(canvas, CAPTURE_IMAGE_TYPE, quality)
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('截图压缩后仍超过 500KB，请调整摄像头画面后重试')
  }

  return {
    blob,
    height: dimensions.height,
    quality,
    size: blob.size,
    type: blob.type,
    width: dimensions.width,
  }
}
