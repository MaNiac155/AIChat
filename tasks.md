# tasks.md

# AI 视觉对话助手开发任务拆解

## 任务 1：初始化项目结构

### 目标

创建 Web + FastAPI 前后端分离项目骨架。

### 影响文件

* `README.md`
* `.gitignore`
* `.env.example`
* `frontend/package.json`
* `frontend/index.html`
* `frontend/src/App.jsx`
* `frontend/src/main.jsx`
* `frontend/src/styles/global.css`
* `backend/requirements.txt`
* `backend/main.py`
* `backend/app/__init__.py`
* `backend/app/config.py`

### 依赖任务

无。

### 参考资料定位

* `spec.md`：第 8.1 节「总体架构」
* `spec.md`：第 8.2 节「前端模块」
* `spec.md`：第 8.3 节「后端模块」

### 完成内容

1. 创建 `frontend/` 和 `backend/` 两个目录。
2. 前端使用 React 或等价 Web 框架初始化。
3. 后端使用 FastAPI 初始化。
4. 增加基础启动说明。
5. 增加环境变量示例文件。
6. 确认前端和后端可以分别启动。

---

## 任务 2：实现后端基础接口与健康检查

### 目标

让后端具备最小可用接口，方便前端联调。

### 影响文件

* `backend/main.py`
* `backend/app/api/__init__.py`
* `backend/app/api/health.py`
* `backend/app/config.py`

### 依赖任务

* 任务 1

### 参考资料定位

* `spec.md`：第 7.4 节「可维护性」
* `spec.md`：第 8.3 节「后端模块」

### 完成内容

1. 增加健康检查接口。
2. 增加跨域配置。
3. 后端启动后能返回服务状态。
4. 为后续聊天接口和视觉接口预留路由结构。

---

## 任务 3：实现前端基础页面布局

### 目标

完成页面三栏或两栏布局，包含摄像头区域、聊天区域和 AI 角色区域。

### 影响文件

* `frontend/src/App.jsx`
* `frontend/src/styles/global.css`
* `frontend/src/components/CameraView.jsx`
* `frontend/src/components/ChatPanel.jsx`
* `frontend/src/components/Avatar.jsx`
* `frontend/src/components/VoiceInput.jsx`

### 依赖任务

* 任务 1

### 参考资料定位

* `spec.md`：第 5 节「能力清单」
* `spec.md`：第 8.2 节「前端模块」

### 完成内容

1. 页面左侧展示摄像头区域。
2. 页面右侧展示聊天区域。
3. 页面包含 AI 角色展示区域。
4. 页面包含语音输入按钮和文本输入兜底入口。
5. 所有组件先使用静态数据渲染。

---

## 任务 4：实现摄像头预览与权限处理

### 目标

前端可以调用浏览器摄像头，并在页面中展示实时预览。

### 影响文件

* `frontend/src/components/CameraView.jsx`
* `frontend/src/App.jsx`
* `frontend/src/styles/global.css`

### 依赖任务

* 任务 3

### 参考资料定位

* `spec.md`：第 4 节「项目目标」
* `spec.md`：第 5 节「能力清单」中的「摄像头预览」
* `spec.md`：第 7.1 节「可用性」

### 完成内容

1. 用户点击开启摄像头后，页面展示摄像头实时画面。
2. 摄像头开启失败时，页面显示明确状态。
3. 摄像头未开启时，视觉问答入口不可用或提示用户先开启摄像头。
4. 摄像头组件对外提供获取当前画面的能力，供后续截图任务使用。

---

## 任务 5：实现当前帧截图能力

### 目标

前端可以从摄像头视频流中截取当前画面，并转换为可发送给后端的数据。

### 影响文件

* `frontend/src/components/CameraView.jsx`
* `frontend/src/utils/image.js`
* `frontend/src/App.jsx`

### 依赖任务

* 任务 4

### 参考资料定位

* `spec.md`：第 8.4 节「主流程」
* `spec.md`：第 8.5 节「成本控制设计」
* `checklist.md`：摄像头与截图验收项

### 完成内容

1. 使用隐藏画布从视频元素中截取当前帧。
2. 截图前对图像进行缩放或压缩。
3. 将截图结果提供给聊天主流程。
4. 增加开发调试入口，方便确认截图是否成功。

---

## 任务 6：实现语音输入与文本兜底输入

### 目标

用户可以通过语音输入问题，也可以通过文本输入测试同一套流程。

### 影响文件

* `frontend/src/components/VoiceInput.jsx`
* `frontend/src/components/ChatPanel.jsx`
* `frontend/src/App.jsx`
* `frontend/src/hooks/useSpeechRecognition.js`

### 依赖任务

* 任务 3

### 参考资料定位

* `spec.md`：第 5 节「能力清单」中的「麦克风输入」「语音转文字」「文本兜底输入」
* `spec.md`：第 7.1 节「可用性」
* `spec.md`：第 8.4 节「主流程」

### 完成内容

1. 实现语音输入按钮。
2. 用户点击后进入聆听状态。
3. 语音识别结果显示到输入框或聊天区域。
4. 语音识别失败时，用户仍可使用文本输入。
5. 语音和文本输入最终进入同一个发送函数。

---

## 任务 7：实现 AI 角色状态动画

### 目标

根据用户交互阶段展示 AI 角色状态，提升自然度。

### 影响文件

* `frontend/src/components/Avatar.jsx`
* `frontend/src/styles/avatar.css`
* `frontend/src/App.jsx`

### 依赖任务

* 任务 3
* 任务 6

### 参考资料定位

* `spec.md`：第 5 节「能力清单」中的「角色状态动画」
* `spec.md`：第 7.2 节「响应速度」
* `spec.md`：第 8.4 节「主流程」

### 完成内容

1. 实现待机状态。
2. 实现聆听状态。
3. 实现思考状态。
4. 实现说话状态。
5. 前端主状态变化时，角色动画同步变化。
6. 初版使用 2D 图片、CSS 动画或简单 SVG 动画，不接入复杂虚拟人引擎。

---

## 任务 8：实现前端 API 封装

### 目标

统一封装前端到后端的请求，为普通聊天和视觉问答做准备。

### 影响文件

* `frontend/src/api/client.js`
* `frontend/src/api/chat.js`
* `frontend/src/App.jsx`

### 依赖任务

* 任务 2
* 任务 3

### 参考资料定位

* `spec.md`：第 8.1 节「总体架构」
* `spec.md`：第 8.4 节「主流程」

### 完成内容

1. 封装普通聊天请求。
2. 封装携带图片的视觉问答请求。
3. 统一处理加载状态。
4. 统一处理前端可展示的失败状态。
5. 确认前端可以调用后端健康检查接口。

---

## 任务 9：实现后端聊天服务

### 目标

后端可以接收用户问题，调用文本对话模型或模拟服务返回 AI 回复。

### 影响文件

* `backend/app/api/chat.py`
* `backend/app/services/chat_service.py`
* `backend/app/schemas/chat.py`
* `backend/app/config.py`
* `backend/main.py`

### 依赖任务

* 任务 2

### 参考资料定位

* `spec.md`：第 8.3 节「后端模块」
* `spec.md`：第 8.4 节「主流程」
* `checklist.md`：普通聊天验收项

### 完成内容

1. 实现普通聊天接口。
2. 后端接收用户问题并返回回答。
3. 返回结果包含 AI 回复文本和角色状态。
4. 在没有配置真实模型时，提供本地模拟回复，保证前端可以联调。
5. 为后续视觉上下文注入保留输入结构。

---

## 任务 10：实现后端视觉理解服务

### 目标

后端可以接收图片，并生成当前画面的文字描述。

### 影响文件

* `backend/app/api/vision.py`
* `backend/app/services/vision_service.py`
* `backend/app/schemas/vision.py`
* `backend/app/config.py`
* `backend/main.py`

### 依赖任务

* 任务 2
* 任务 5

### 参考资料定位

* `spec.md`：第 5 节「能力清单」中的「视觉描述生成」
* `spec.md`：第 8.3 节「后端模块」
* `spec.md`：第 8.5 节「成本控制设计」

### 完成内容

1. 实现图片接收接口。
2. 实现视觉描述生成服务。
3. 支持真实多模态模型调用或本地模拟描述。
4. 返回简短画面描述。
5. 将视觉服务与聊天服务解耦。

---

## 任务 11：实现成本控制策略

### 目标

避免无意义调用视觉模型，体现端云协同成本控制。

### 影响文件

* `frontend/src/utils/intent.js`
* `frontend/src/utils/image.js`
* `backend/app/services/cost_control.py`
* `backend/app/services/vision_service.py`
* `backend/app/services/chat_service.py`
* `backend/app/config.py`

### 依赖任务

* 任务 5
* 任务 9
* 任务 10

### 参考资料定位

* `spec.md`：第 7.3 节「成本控制」
* `spec.md`：第 8.5 节「成本控制设计」
* `checklist.md`：成本控制验收项

### 完成内容

1. 前端判断用户问题是否需要视觉信息。
2. 非视觉问题不截图、不上传图片。
3. 视觉问题才截取当前画面。
4. 上传前进行图片压缩或缩放。
5. 后端缓存最近一次视觉描述。
6. 短时间重复视觉问题时优先复用缓存。
7. 在日志或调试面板中可观察视觉模型调用次数。

---

## 任务 12：实现 AI 回复语音播放

### 目标

AI 回复后，前端自动播放语音，并与角色说话状态联动。

### 影响文件

* `frontend/src/hooks/useSpeechSynthesis.js`
* `frontend/src/components/ChatPanel.jsx`
* `frontend/src/components/Avatar.jsx`
* `frontend/src/App.jsx`
* `backend/app/services/tts_service.py`

### 依赖任务

* 任务 7
* 任务 9

### 参考资料定位

* `spec.md`：第 5 节「能力清单」中的「语音播报」
* `spec.md`：第 7.2 节「响应速度」
* `spec.md`：第 8.4 节「主流程」

### 完成内容

1. 前端接收到 AI 回复后自动播放语音。
2. 语音播放开始时角色切换为说话状态。
3. 语音播放结束后角色回到待机状态。
4. 如果浏览器不支持语音播放，仍显示文本回复。
5. 后端语音服务先预留结构，初版可优先使用浏览器语音合成。

---

## 任务 13：接入主流程

### 目标

把摄像头、语音输入、视觉理解、聊天回复、语音播放和角色动画串成完整流程。

### 影响文件

* `frontend/src/App.jsx`
* `frontend/src/components/CameraView.jsx`
* `frontend/src/components/VoiceInput.jsx`
* `frontend/src/components/ChatPanel.jsx`
* `frontend/src/components/Avatar.jsx`
* `frontend/src/api/chat.js`
* `frontend/src/utils/intent.js`
* `backend/app/api/chat.py`
* `backend/app/api/vision.py`
* `backend/app/services/chat_service.py`
* `backend/app/services/vision_service.py`
* `backend/app/services/cost_control.py`

### 依赖任务

* 任务 4
* 任务 5
* 任务 6
* 任务 7
* 任务 8
* 任务 9
* 任务 10
* 任务 11
* 任务 12

### 参考资料定位

* `spec.md`：第 8.4 节「主流程」
* `spec.md`：第 10 节「完成标准」
* `checklist.md`：端到端验收项

### 完成内容

1. 用户语音输入后进入统一发送流程。
2. 系统根据用户问题判断是否需要视觉信息。
3. 需要视觉信息时，前端截图并上传。
4. 后端生成视觉描述并注入聊天上下文。
5. 后端返回 AI 回复和角色状态。
6. 前端展示回复并播放语音。
7. 角色状态完整经历聆听、思考、说话、待机。
8. 普通聊天和视觉问答都可以完成。

---

## 任务 14：端到端验证

### 目标

按照验收清单验证完整功能，并补充文档说明。

### 影响文件

* `README.md`
* `spec.md`
* `tasks.md`
* `checklist.md`
* `docs/demo.md`
* `frontend/src/App.jsx`
* `backend/main.py`

### 依赖任务

* 任务 13

### 参考资料定位

* `spec.md`：第 10 节「完成标准」
* `checklist.md`：全部验收项

### 完成内容

1. 按照 `checklist.md` 逐项验证。
2. 记录最终实现了哪些用户故事。
3. 记录未实现能力和原因。
4. 记录实际采用的成本控制策略。
5. 录制或准备一套固定演示流程。
6. 修复端到端流程中的明显问题。
7. 确保评审可以根据文档启动和验证项目。
