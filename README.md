# AI 视觉对话助手

这是一个基于 React 和 FastAPI 的前后端分离项目。项目目标是让用户通过浏览器摄像头、麦克风和文本输入与 AI 助手进行自然对话，并在需要时使用当前摄像头画面作为视觉上下文。

当前已完成项目基础结构初始化，后续功能将按照 `task.md` 逐步实现。

## 项目结构

```text
AIChat/
├── frontend/          # React + Vite Web 前端
├── backend/           # FastAPI 后端
├── .env.example       # 环境变量示例
├── spec.md            # 项目规格说明
├── task.md            # 开发任务拆分
└── checklist.md       # 验收清单
```

## 环境要求

- Node.js 18+
- Python 3.10+

## 环境变量

复制根目录的 `.env.example` 为 `.env`，并根据需要修改配置：

```powershell
Copy-Item .env.example .env
```

默认启用 Mock 模式，不配置真实模型 API Key 也可以启动项目。

## 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问 `http://localhost:8000/`，可以查看后端基础状态。

## 启动前端

另开一个终端：

```powershell
cd frontend
npm install
npm run dev
```

启动后访问终端中显示的地址，默认是 `http://localhost:5173/`。

## 当前状态

- 已创建 React/Vite 前端骨架。
- 已创建 FastAPI 后端骨架。
- 已提供统一的环境变量示例和基础启动说明。
- 摄像头、语音、聊天、视觉理解和角色动画将在后续任务中实现。
