# ToyGlobal Frontend Workspace

React + Vite frontend for the three-service workflow:

1. Image input and feature extraction
2. Cross-cultural analysis
3. Redesign suggestion and AI assets

## Local run

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

If backend runs on default `http://localhost:3000`, no extra config is needed.

## Env

- `VITE_API_BASE_URL`: backend API base URL (default in `.env.example` is `http://localhost:3000/api/v1`)
- `VITE_API_TIMEOUT_MS`: frontend request timeout in milliseconds (default `180000`)

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
