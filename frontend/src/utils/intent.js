const VISUAL_INTENT_PATTERNS = [
  /看看/,
  /看一下/,
  /看一眼/,
  /摄像头/,
  /镜头/,
  /画面/,
  /桌上/,
  /桌面上/,
  /手里/,
  /手上/,
  /面前/,
  /旁边/,
  /这个东西/,
  /这是什么/,
  /什么颜色/,
  /什么样子/,
]

export function needsVisionContext(message) {
  const normalizedMessage = message?.trim()
  if (!normalizedMessage) {
    return false
  }

  return VISUAL_INTENT_PATTERNS.some((pattern) => pattern.test(normalizedMessage))
}
