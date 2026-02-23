# ToyGlobal 前端工作区

该目录是 ToyGlobal 的前端应用（React + Vite），对应完整三步流程：

1. 图像输入与特征解析
2. 跨文化分析
3. 改款建议与 AI 资产展示

## 本地运行

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

若后端使用默认地址 `http://localhost:3000`，通常无需额外配置。

## 环境变量

- `VITE_API_BASE_URL`：后端 API 地址（默认 `http://localhost:3000/api/v1`）
- `VITE_API_TIMEOUT_MS`：前端请求超时（毫秒，默认 `180000`）

## 常用命令

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
