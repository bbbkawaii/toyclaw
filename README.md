# ToyGlobal AI Agent Backend

This repository currently implements the first three modules:

- Image input (upload + feature extraction)
- Cross-cultural analysis (market selection + taboo/festival/competitor analysis)
- Redesign suggestion (color/shape/packaging recommendations + AI asset generation)

## Tech stack

- Node.js + TypeScript
- Fastify
- Prisma + SQLite
- Frontend workspace: React + Vite + Zustand + React Hook Form + Framer Motion
- Vision provider abstraction (supports Gemini/OpenAI/Sophnet; default env points to Gemini `gemini-3-flash-preview`)
- Image generation provider abstraction (Gemini provider by default when key is configured)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Prepare env file:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Set provider keys in `.env`:

- If `VISION_PROVIDER=sophnet`, configure `SOPHNET_API_KEY`.
- If `VISION_PROVIDER=openai`, configure `OPENAI_API_KEY`.
- If `VISION_PROVIDER=gemini`, configure `GEMINI_VISION_API_KEY` (or reuse `GEMINI_IMAGE_API_KEY`).
- For phase 3 image generation integration, configure `GEMINI_IMAGE_API_KEY`.
- If frontend is served from another origin, set `CORS_ORIGIN` (e.g. `http://localhost:5173`).

3. Create DB schema:

```bash
npm run prisma:push
```

4. Start dev server:

```bash
npm run dev
```

`npm run dev` runs `prisma db push --skip-generate` automatically via `predev`, so schema drift (for example missing `CrossCulturalAnalysis`) is fixed on startup.

## Frontend workspace

An independent frontend app is in `frontend/` (React + Vite).

1. Install frontend deps:

```bash
cd frontend
npm install
```

2. Prepare frontend env:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. Start frontend:

```bash
npm run dev
```

From repo root, you can also use:

```bash
npm run dev:frontend
```

## API

### POST `/api/v1/image-input/analyze`

`multipart/form-data` fields:

- `image`: jpg/png/webp image file (required)
- `directionText`: free text redesign direction (optional)
- `directionPreset`: one of `CHANGE_COLOR`, `SEASONAL_THEME`, `ADD_ACCESSORY` (optional)

Validation rule: `directionText` and `directionPreset` require at least one.

### GET `/api/v1/image-input/analyze/:requestId`

Fetch a stored analysis result by request ID.

### POST `/api/v1/cross-cultural/analyze`

`application/json` body:

- `requestId`: image analysis request ID
- `targetMarket`: one of `US | EUROPE | MIDDLE_EAST | SOUTHEAST_ASIA | JAPAN_KOREA`

Returns taboo detection, festival/hot theme matches, and competitor style references.

### GET `/api/v1/cross-cultural/analyze/:analysisId`

Fetch stored cross-cultural analysis by analysis ID.

### POST `/api/v1/redesign/suggest`

`application/json` body:

- `requestId`: image analysis request ID
- `crossCulturalAnalysisId`: cross-cultural analysis ID associated with the same request
- `assets` (optional):
  - `previewImage`: boolean
  - `threeView`: boolean
  - `showcaseVideo`: boolean

Returns redesign recommendations:

- color schemes
- shape/detail adjustment suggestions
- packaging style suggestions
- AI assets: preview image, three-view images, and showcase video script (no keyframe/video generation model yet)

### GET `/api/v1/redesign/suggest/:suggestionId`

Fetch stored redesign suggestion by suggestion ID.

## Tests

```bash
npm test
```

The test suite uses a mocked vision provider and temporary SQLite database.
