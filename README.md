# AI 视觉对话助手

一个基于 React、FastAPI 和 OpenAI 兼容模型接口的浏览器视觉对话助手。用户可以使用文本或语音提问；当问题需要查看画面时，系统按需截取摄像头当前帧、生成视觉描述，并结合对话记忆生成回复。AI 回复可通过浏览器语音合成自动播放，并驱动角色动画状态。

## 已实现能力

- 摄像头开启、实时预览、当前帧截取与 JPEG 压缩。
- 文本输入和浏览器语音识别进入统一聊天流程。
- 视觉意图判断，只对视觉问题上传图片。
- OpenAI 兼容聊天和视觉模型调用，以及无 API Key 的 Mock 模式。
- System Prompt 注入和基于会话 ID 的短期对话记忆。
- 5 分钟视觉描述缓存、视觉模型调用计数和日志。
- AI 回复浏览器语音播放与开关。
- `idle`、`listening`、`thinking`、`talking` 角色状态联动。
- 摄像头、模型、图片上传和浏览器能力错误提示。

## demo视频
 通过网盘分享的文件：2026-06-13 21-36-07.mp4
链接: https://pan.baidu.com/s/1MeayRV3OEhYq-kaW3d7mcA 提取码: ah12 复制这段内容后打开百度网盘手机App，操作更方便哦 


## 项目结构

```text
AIChat/
├── frontend/                 # React + Vite 前端
├── backend/                  # FastAPI 后端
│   └── tests/test_e2e.py     # Mock 端到端 API 验收
├── docs/
│   ├── demo.md               # 三分钟固定演示流程
│   ├── design.md             # 项目设计文档
│   └── verification.md       # 最终验收记录
├── .env.example              # 环境变量示例
├── spec.md                   # 项目规格
├── task.md                   # 原始任务拆解
├── tasks.md                  # 评审要求的任务拆解副本
└── checklist.md              # 验收清单
```

## 环境要求

- Windows PowerShell
- Python 3.10+
- Node.js 18+
- 推荐使用最新版 Edge 或 Chrome

摄像头和麦克风功能需要通过浏览器权限授权。浏览器语音识别在不同浏览器、系统语言和网络环境中的支持程度可能不同。

## 环境变量

在项目根目录创建配置：

```powershell
Copy-Item .env.example .env
```

开发和演示前建议先使用：

```env
MOCK_MODE=true
```

接入真实 OpenAI 兼容模型时配置：

```env
MOCK_MODE=false
MODEL_API_KEY=your-api-key
MODEL_BASE_URL=https://your-provider.example/v1
CHAT_MODEL=your-chat-model
VISION_MODEL=your-vision-model
MODEL_TRUST_ENV=false
```

`MODEL_TRUST_ENV=false` 表示模型请求忽略系统代理环境变量并直接连接模型服务。
如果必须通过 `HTTP_PROXY` 或 `HTTPS_PROXY` 访问模型服务，再将其改为 `true`。

主要成本控制配置：

```env
VISION_MAX_TOKENS=120
VISION_CACHE_TTL_SECONDS=300
```

## 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## 启动前端

另开一个 PowerShell 终端：

```powershell
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 使用流程

1. 打开页面并允许摄像头、麦克风权限。
2. 点击“开启摄像头”。
3. 开启“自动视觉理解”。
4. 使用文本或语音提问“你看看桌上有什么”。
5. 系统截图并调用视觉接口，将视觉描述注入聊天上下文。
6. AI 回复显示并自动播放语音，角色从思考切换到说话，再回到待机。
7. 提问“给我讲个笑话”，验证普通问题不会调用视觉接口。

完整演示步骤见 [docs/demo.md](docs/demo.md)。

用户故事、视觉与语音设计、端云协同和成本控制说明见
[docs/design.md](docs/design.md)。

## 自动化验证

运行后端 Mock 端到端测试：

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

运行前端生产构建：

```powershell
cd frontend
npm run build
```

最终验收结果见 [docs/verification.md](docs/verification.md)。

## 成本控制策略

- 摄像头只在浏览器本地持续预览，不上传视频流。
- 只有开启自动视觉理解且检测到视觉问题时才截图上传。
- 图片上传前缩放至不超过 `768px`，并压缩到不超过 `500KB`。
- 视觉模型只生成简短画面描述，默认最多输出 `120` Token。
- 最近视觉描述默认缓存 `5` 分钟，短时间重复提问复用缓存。
- 普通聊天和视觉理解服务解耦，可以分别替换低成本模型。
- 开发阶段可使用 Mock 模式，不产生模型调用费用。

## 当前限制

- 对话记忆和视觉缓存保存在进程内，服务重启后会丢失。
- 视觉意图判断目前采用前端关键词规则。
- 浏览器语音合成音色由操作系统和浏览器提供。
- 尚未接入天气等实时工具。
- 真实模型效果、摄像头和麦克风权限需要在目标演示机器上手动验收。
