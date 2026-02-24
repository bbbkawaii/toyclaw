# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

ToyGlobal AI Agent — a full-stack app that helps redesign toys for different global markets. Users upload a toy image, the system analyzes it with AI vision, performs cross-cultural analysis for a target market, then generates redesign suggestions with AI-generated preview images.

## Commands

| Task | Command |
|---|---|
| Backend dev (hot reload) | `npm run dev` |
| Frontend dev | `npm run dev:frontend` |
| Run all tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Build backend | `npm run build` |
| Build frontend | `npm run build:frontend` |
| Lint frontend | `npm run lint:frontend` |
| Sync DB schema | `npm run prisma:push` |

`npm run dev` automatically runs `prisma db push --skip-generate` via the `predev` script.

## Architecture

**Backend** (`src/`): Fastify + TypeScript, CommonJS module system.

- `src/app.ts` / `src/server.ts` — app bootstrap and server entry point.
- `src/modules/` — three feature modules, each with `routes.ts`, `service.ts`, `schemas.ts`, `types.ts`:
  - `image-input` — upload toy image + parse features via AI vision.
  - `cross-cultural` — cultural analysis for a target market (US, Europe, Middle East, Southeast Asia, Japan/Korea).
  - `redesign` — generate redesign suggestions, preview images, three-view drawings, video scripts.
- `src/providers/` — AI provider adapters (Gemini, OpenAI, Sophnet) for vision analysis and image generation.
- `src/lib/` — shared utilities (error handling, etc.).
- `prisma/schema.prisma` — SQLite database with models: `AnalysisRequest`, `CrossCulturalAnalysis`, `RedesignSuggestion`.

**Frontend** (`frontend/`): React + Vite SPA.

- `frontend/src/pages/` — page components.
- `frontend/src/store/` — Zustand state management.
- `frontend/src/shared/` — shared UI components.
- CSS Modules (`*.module.css`) for styling, Framer Motion for animations.

The three-step pipeline flows sequentially: image-input → cross-cultural → redesign. Each step's API result feeds the next as input (`requestId` → `crossCulturalAnalysisId` → `suggestionId`).

## Coding Conventions

- **Backend**: strict TypeScript, 2-space indent, double quotes, semicolons, trailing commas.
- **Backend files**: kebab-case (`image-input`, `error-handler.ts`).
- **React components**: PascalCase (`WorkspaceLayout.tsx`).
- **Functions/variables**: camelCase.
- **Commits**: Conventional Commits — `feat(frontend): ...`, `fix(redesign): ...`, `docs(readme): ...`.

## Testing

Tests use Vitest in `tests/*.test.ts`. Tests follow route-focused naming (e.g., `image-input.routes.test.ts`) and use `app.inject` with mocked providers to avoid real API calls. Cover both success and error/validation paths.

## Environment

Copy `.env.example` to `.env` (and `frontend/.env.example` to `frontend/.env`). Key variables:

- `VISION_PROVIDER` — selects vision AI backend: `gemini` (default), `openai`, or `sophnet`.
- `GEMINI_IMAGE_API_KEY` — required for image generation in the redesign module.
- `CORS_ORIGIN` — must match frontend origin (default `http://localhost:5173`).
- Uploaded files go to `storage/uploads/`.
