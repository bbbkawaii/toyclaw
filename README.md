# ToyBridge AI — 玩具出海智能改款助手

面向中小型玩具制造企业的 AI 驱动出海辅助系统。通过多模态人工智能技术，用户只需上传一张玩具图片并选择目标市场，系统即可自动完成从图像特征提取、跨文化风险评估到改款建议生成的全流程，帮助企业快速适配全球不同市场，大幅降低产品出海的试错成本与周期。

## 方案说明

### 应用场景

本系统针对中小型玩具企业在拓展海外市场时面临的四大核心痛点：

**文化壁垒** — 不同国家和地区对颜色、图案、造型有截然不同的文化禁忌与偏好。例如白色在中东市场与日韩市场的寓意完全不同；某些动物形象在特定宗教文化中存在敏感性。传统方式依赖人工经验判断，容易遗漏，一旦触犯文化禁忌可能导致产品滞销甚至品牌声誉受损。

**改款成本高** — 玩具出海通常需要针对不同市场做外观、配色、包装的本地化调整。传统流程需要设计师反复打样、沟通，周期长、成本高，中小企业难以为每个目标市场单独投入设计资源。

**市场洞察缺失** — 中小企业缺乏海外市场的一手数据，难以了解目标市场的节日热点、竞品风格趋势、消费者审美偏好，导致产品定位模糊、错失季节性销售窗口。

**合规风险** — 不同出口目的地有不同的玩具安全标准（如欧盟 CE、美国 ASTM F963），材料安全、年龄分级等合规要求复杂，稍有疏忽可能导致产品被扣押或召回。

### 项目目标

- **降低出海试错成本**：用户只需上传一张玩具图片、选择目标市场，系统即可在数分钟内输出完整的改款方案，替代传统数周的人工调研与设计迭代。
- **AI 驱动的全流程自动化**：从图像特征提取 → 跨文化风险评估 → 改款配色/造型/包装建议 → AI 预览图生成，全链路由多模态 AI 协同完成，无需专业设计师介入即可获得可视化方案。
- **多市场覆盖**：内置美国、欧洲、中东、东南亚、日韩五大目标市场的文化知识库，支持一次分析、多市场对比。
- **可选合规评估**：集成基于 RAG 技术的合规文档检索与评估能力，辅助企业快速了解目标市场的认证要求。

## 核心功能

### 图像输入与特征提取

- 支持上传 JPG / PNG / WebP 格式的玩具图片（最大 10MB）
- 用户可指定改款方向：自由文本描述，或选择预设方向（换色 `CHANGE_COLOR`、季节主题 `SEASONAL_THEME`、添加配件 `ADD_ACCESSORY`）
- 系统自动对图片进行预处理优化（缩放至 768px、WebP 压缩），降低 AI 推理成本
- 调用多模态视觉 AI 提取玩具的四维特征：
  - **形状** — 圆形 / 方形 / 不规则等
  - **颜色** — 主色调名称及 HEX 值
  - **材质** — 毛绒 / 塑胶 / 木质等
  - **风格** — 卡通 / 写实 / 极简等
- 内置本地兜底机制：当 AI 提供商不可用时，通过 Sharp 图像库进行像素采样、色彩量化等启发式特征提取，确保服务可用性

### 跨文化分析

覆盖 5 大目标市场：美国 (US)、欧洲 (EUROPE)、中东 (MIDDLE_EAST)、东南亚 (SOUTHEAST_ASIA)、日韩 (JAPAN_KOREA)。

- **文化禁忌检测**：将提取的产品特征（颜色、材质、造型）与市场文化知识库中的禁忌规则进行匹配，输出风险等级（高 / 中 / 低）、证据说明、风险描述及调整建议
- **节日/热点主题匹配**：根据目标市场的节日日历与当前季节，通过关键词命中、色彩重叠度、改款方向提示等维度综合评分，推荐 Top 3 最相关的季节性主题
- **竞品风格参考**：匹配目标市场的主流竞品风格原型，通过关键词及色板重叠度评分，发现差异化机会点

### 改款建议

- **配色方案**：每个市场生成 3 套策略性配色
  - 「市场适配核心色」— 安全主流色，贴近当地消费者偏好
  - 「季节营销色」— 结合节日主题的应季配色
  - 「差异化货架色」— 与竞品形成视觉区分的差异化配色
  - 每套方案包含主色 / 辅色 / 点缀色及 HEX 值
- **造型调整建议**：最多 4 项优先级排序的造型/细节调整，分别针对禁忌风险规避、季节机会利用、竞品差异化、品质感提升
- **包装风格建议**：针对不同市场输出定制化包装方案（如美国市场「零售货架英雄盒」、欧洲市场「环保极简纸盒」、日韩市场「精密开窗盒」），附带「营销活动叠加套件」
- **AI 资产生成**：
  - 改款预览图 — 基于改款建议调用 Gemini 图像生成 API 渲染 2D 预览
  - 三视图（正面 / 侧面 / 背面）— 以预览图为参考，保证多视角一致性
  - 展示视频脚本 — 生成文字版视频拍摄/展示脚本（当前不生成实际视频）
- **资产重试**：单个资产生成失败时，支持独立重试，无需重新运行整个流程

### 合规与认证（可选模块）

- 基于 RAG（检索增强生成）架构，预先将合规标准 PDF 文档切分、向量化，存储为本地索引
- 运行时通过 Gemini Embedding 进行语义检索，匹配与当前产品最相关的合规条款
- 将检索到的合规文档片段发送至 Gemini LLM，生成结构化的合规评估报告，包含材料安全、年龄分级、标签要求等建议
- 模块按需启用：系统启动时自动检测 Gemini API Key 及合规索引是否就绪，前端通过 `/api/v1/capabilities` 动态感知并展示/隐藏合规入口

### 项目历史与仪表盘

- 所有分析记录自动持久化到数据库，支持分页浏览历史项目
- 项目详情页展示完整的流水线结果：图像特征 → 文化分析 → 改款建议 → 合规评估

## 技术架构

### 整体设计

前后端分离架构，后端提供 RESTful API，前端为 React SPA。核心业务为三步顺序流水线，每步结果通过 ID 串联：

```
图像输入 (requestId) → 跨文化分析 (analysisId) → 改款建议 (suggestionId)
```

### 后端技术栈

| 技术 | 用途 |
|---|---|
| Fastify 5 | HTTP 框架 |
| TypeScript (strict, CommonJS) | 类型安全 |
| Prisma 6 + SQLite | ORM 与数据库 |
| Zod | 请求/响应校验 |
| Sharp | 图像预处理与本地特征提取 |
| tsx | 开发热重载 |

### 前端技术栈

| 技术 | 用途 |
|---|---|
| React 19 + Vite 7 | UI 框架与构建工具 |
| Tailwind CSS 3.4 | 样式（自定义主题色系） |
| Zustand 5 | 状态管理 |
| React Router 7 | 路由（含懒加载代码分割） |
| React Hook Form + Zod | 表单校验 |
| Framer Motion | 动画效果 |
| Axios | HTTP 请求 |

### AI 多 Provider 架构

| 能力 | 可用 Provider | 切换方式 |
|---|---|---|
| 视觉分析（特征提取） | Gemini / OpenAI / Sophnet | `VISION_PROVIDER` 环境变量 |
| 图像生成（预览图/三视图） | Gemini | `GEMINI_IMAGE_API_KEY` |
| 文本嵌入（合规 RAG） | Gemini | `GEMINI_EMBEDDING_MODEL` |
| 合规评估（LLM） | Gemini | `GEMINI_COMPLIANCE_MODEL` |

所有 Provider 遵循统一接口（`VisionProvider` / `ImageGenerationProvider` / `EmbeddingProvider`），便于扩展新的 AI 供应商。

### 数据库模型

```
AnalysisRequest (核心实体)
├── AnalysisResult (1:1, 图像特征)
├── CrossCulturalAnalysis[] (1:N, 按市场)
│   └── RedesignSuggestion[] (1:N)
└── ComplianceAssessment[] (1:N, 按市场)
```

所有子实体级联删除。数据库 Schema 定义于 `prisma/schema.prisma`。

## 项目结构

```
├── src/                          # 后端源码
│   ├── app.ts / server.ts        # 应用启动与服务器入口
│   ├── config.ts                 # Zod 环境配置校验
│   ├── modules/
│   │   ├── image-input/          # 图像输入模块 (routes/service/schemas/types)
│   │   ├── cross-cultural/       # 跨文化分析模块
│   │   ├── redesign/             # 改款建议模块
│   │   ├── compliance/           # 合规评估模块（可选）
│   │   └── projects/             # 项目历史模块
│   ├── providers/
│   │   ├── vision/               # 视觉 AI 适配器 (gemini/openai/sophnet)
│   │   ├── image/                # 图像生成适配器 (gemini)
│   │   └── embedding/            # 文本嵌入适配器 (gemini)
│   └── lib/                      # 工具库（错误处理、文件存储、HTTP）
├── frontend/                     # 前端 React SPA
│   └── src/
│       ├── pages/                # 页面组件 (Landing/Dashboard/Workflow/ProjectDetail)
│       ├── store/                # Zustand 状态管理
│       ├── shared/               # 共享 UI 组件 / API 客户端 / 类型 / i18n
│       └── assets/               # 静态资源
├── prisma/schema.prisma          # 数据库 Schema
├── tests/                        # Vitest 测试用例
├── scripts/                      # 合规文档向量化入库脚本
└── storage/                      # 上传文件 & 合规向量索引
```

每个后端模块遵循统一结构：`routes.ts`（路由定义）、`service.ts`（业务逻辑）、`schemas.ts`（Zod 校验）、`types.ts`（类型定义）。

## 使用指南

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 后端依赖
npm install

# 前端依赖
npm --prefix frontend install
```

### 配置环境变量

```bash
# 后端
cp .env.example .env

# 前端
cp frontend/.env.example frontend/.env
```

编辑 `.env`，按需填写以下关键变量：

**服务器配置**

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 后端端口 | `3000` |
| `DATABASE_URL` | SQLite 数据库路径 | `file:./dev.db` |
| `CORS_ORIGIN` | 前端域名 | `http://localhost:5173` |

**视觉分析 Provider**（三选一，通过 `VISION_PROVIDER` 切换）

| 变量 | 说明 |
|---|---|
| `VISION_PROVIDER` | `gemini`（默认）/ `openai` / `sophnet` |
| `GEMINI_VISION_API_KEY` | Gemini 视觉 API 密钥 |
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `SOPHNET_API_KEY` | Sophnet (Kimi) API 密钥 |

**图像生成**

| 变量 | 说明 |
|---|---|
| `GEMINI_IMAGE_API_KEY` | Gemini 图像生成 API 密钥（改款预览图 & 三视图必需） |

**合规模块（可选）**

| 变量 | 说明 |
|---|---|
| `COMPLIANCE_INDEX_DIR` | 合规向量索引目录（默认 `storage/compliance-index`） |

**存储 & 超时**

| 变量 | 说明 | 默认值 |
|---|---|---|
| `UPLOAD_DIR` | 上传文件目录 | `storage/uploads` |
| `MAX_FILE_SIZE_MB` | 最大上传文件大小 | `10` |
| `PROVIDER_TIMEOUT_MS` | AI Provider 请求超时 | `30000` |

### 启动开发服务器

```bash
# 启动后端（自动同步数据库 Schema）
npm run dev

# 启动前端（另一个终端）
npm run dev:frontend
```

后端默认运行在 `http://localhost:3000`，前端默认运行在 `http://localhost:5173`。

`npm run dev` 会自动执行 `prisma db push --skip-generate`，确保本地数据库表结构与 Schema 同步。

### 测试与构建

```bash
# 运行全部测试
npm test

# 监听模式运行测试
npm run test:watch

# 构建后端
npm run build

# 构建前端
npm run build:frontend

# 前端代码检查
npm run lint:frontend
```

## API 概览

所有接口前缀为 `/api/v1`。

| 模块 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 图像输入 | `POST` | `/image-input/analyze` | 上传图片并提取特征（multipart/form-data） |
| 图像输入 | `GET` | `/image-input/analyze/:requestId` | 获取分析结果 |
| 跨文化分析 | `POST` | `/cross-cultural/analyze` | 执行跨文化分析 |
| 跨文化分析 | `GET` | `/cross-cultural/analyze/:analysisId` | 获取分析结果 |
| 改款建议 | `POST` | `/redesign/suggest` | 生成改款建议 |
| 改款建议 | `GET` | `/redesign/suggest/:suggestionId` | 获取建议结果 |
| 改款建议 | `POST` | `/redesign/suggest/:suggestionId/retry` | 重试失败的资产生成 |
| 合规评估 | `POST` | `/compliance/assess` | 执行合规评估 |
| 合规评估 | `GET` | `/compliance/assess/:assessmentId` | 获取评估结果 |
| 能力检测 | `GET` | `/capabilities` | 查询可用功能（合规模块是否启用等） |
| 健康检查 | `GET` | `/healthz` | 服务健康状态 |

## 开发规范

- **后端文件**：kebab-case（`image-input`、`error-handler.ts`）
- **React 组件**：PascalCase（`WorkspaceLayout.tsx`）
- **函数/变量**：camelCase
- **提交信息**：Conventional Commits — `feat(frontend): ...`、`fix(redesign): ...`、`docs(readme): ...`
- **测试**：Vitest，路由级命名（如 `image-input.routes.test.ts`），使用 `app.inject` + Provider Mock，覆盖成功与错误路径
