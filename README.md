# ToyGlobal AI Agent（全栈项目）

本仓库已实现以下三大模块（前后端一体）：

1. 图像输入模块
   - 玩具图片上传（`image`）
   - 改款方向输入（`directionText` 或 `directionPreset`）
   - 图像特征解析（形状 / 颜色 / 材质 / 风格）
2. 跨文化分析模块
   - 目标市场选择（美国 / 欧洲 / 中东 / 东南亚 / 日韩）
   - 文化禁忌检测
   - 节日/热点主题匹配
   - 竞品风格参考
3. 改款建议模块
   - 颜色方案建议
   - 造型/细节调整建议
   - 包装风格建议
   - AI 资产输出：改款预览图、三视图、展示视频脚本
   - 注意：当前没有视频生成模型，不生成视频或关键帧

## 技术栈

- 后端：Node.js + TypeScript + Fastify
- 数据库：Prisma + SQLite
- 前端：React + Vite + Zustand + React Hook Form + Framer Motion
- 图像解析 Provider：Gemini / OpenAI / Sophnet（默认 Gemini）
- 图片生成 Provider：Gemini（用于预览图与三视图）

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 初始化环境变量

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

按需填写 `.env` 中的密钥：

- `VISION_PROVIDER=sophnet` 时需要 `SOPHNET_API_KEY`
- `VISION_PROVIDER=openai` 时需要 `OPENAI_API_KEY`
- `VISION_PROVIDER=gemini` 时需要 `GEMINI_VISION_API_KEY`（或复用 `GEMINI_IMAGE_API_KEY`）
- 第三模块图片资产需要 `GEMINI_IMAGE_API_KEY`
- 若前端域名不是默认值，配置 `CORS_ORIGIN`（例如 `http://localhost:5173`）

### 3) 启动后端

```bash
npm run dev
```

说明：`npm run dev` 会自动触发 `predev`，执行 `prisma db push --skip-generate`，避免本地表结构缺失（例如 `CrossCulturalAnalysis` 不存在）。

### 4) 启动前端

```bash
npm run dev:frontend
```

或进入 `frontend/` 目录单独启动：

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API 概览

### 图像输入

- `POST /api/v1/image-input/analyze`
  - `multipart/form-data`
  - 字段：
    - `image`：必填，支持 jpg/png/webp
    - `directionText`：选填，自定义改款方向
    - `directionPreset`：选填，枚举 `CHANGE_COLOR | SEASONAL_THEME | ADD_ACCESSORY`
  - 规则：`directionText` 与 `directionPreset` 至少提供一个
- `GET /api/v1/image-input/analyze/:requestId`

### 跨文化分析

- `POST /api/v1/cross-cultural/analyze`
  - `application/json`
  - 字段：
    - `requestId`
    - `targetMarket`：`US | EUROPE | MIDDLE_EAST | SOUTHEAST_ASIA | JAPAN_KOREA`
- `GET /api/v1/cross-cultural/analyze/:analysisId`

### 改款建议

- `POST /api/v1/redesign/suggest`
  - `application/json`
  - 字段：
    - `requestId`
    - `crossCulturalAnalysisId`
    - `assets`（可选）：
      - `previewImage`：是否生成改款预览图
      - `threeView`：是否生成三视图
      - `showcaseVideo`：是否生成展示视频脚本
- `GET /api/v1/redesign/suggest/:suggestionId`

`showcaseVideo` 当前行为：

- `status` 只会是 `SCRIPT_ONLY` 或 `SKIPPED`
- `keyframes` 固定为空数组 `[]`

## 测试与构建

```bash
npm test
npm run build
npm --prefix frontend run build
```
