# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the Fastify + TypeScript backend. Core feature modules live in `src/modules/` (`image-input`, `cross-cultural`, `redesign`) and are organized by `routes.ts`, `service.ts`, `schemas.ts`, and `types.ts`. Shared runtime code is in `src/lib/`, provider integrations are in `src/providers/`, and app bootstrap is `src/app.ts` + `src/server.ts`.

Database models are defined in `prisma/schema.prisma` (SQLite via Prisma). Backend build output goes to `dist/`. Uploaded files are stored under `storage/uploads/`.

The React app is in `frontend/` (`frontend/src/pages`, `frontend/src/shared`, `frontend/src/store`). Backend tests live in `tests/*.test.ts`.

## Build, Test, and Development Commands
- `npm run dev`: start backend with hot reload (`predev` auto-runs `prisma db push --skip-generate`).
- `npm run dev:frontend`: start Vite frontend from repo root.
- `npm test`: run backend Vitest suite once.
- `npm run build`: compile backend TypeScript to `dist/`.
- `npm run build:frontend`: production build for frontend.
- `npm run lint:frontend`: run ESLint for `frontend/`.
- `npm run prisma:push`: manually sync Prisma schema to local DB.

## Coding Style & Naming Conventions
TypeScript is `strict` on backend; keep types explicit at API boundaries. Follow existing style: 2-space indentation, double quotes, semicolons, and trailing commas.

Naming patterns:
- Backend files/modules: kebab-case (`image-input`, `error-handler.ts`).
- React components/pages: PascalCase (`WorkspaceLayout.tsx`).
- Utility/store/function identifiers: camelCase.
- CSS Modules: `*.module.css`.

## Testing Guidelines
Tests use Vitest (`vitest.config.ts`) with `tests/**/*.test.ts` in Node environment. Follow existing route-focused naming (`image-input.routes.test.ts`), using `app.inject` and mocked providers to avoid external API calls.

For new endpoint behavior, add both success-path and error/validation-path coverage. No enforced coverage threshold exists, so prioritize critical flows.

## Commit & Pull Request Guidelines
Use Conventional Commit style seen in history: `feat(frontend): ...`, `fix(redesign): ...`, `docs(readme): ...`. Keep scope specific and commits focused on one change.
After code changes are completed and verified locally, commit and push to GitHub promptly (for this repo: `origin/main` unless a feature branch is used).

PRs should include:
- Clear summary of user-visible/backend behavior changes.
- Linked issue/task (if available).
- Verification steps and command results (`npm test`, build/lint commands).
- Screenshots/GIFs for frontend UI changes.
- Notes for schema/env updates (`prisma/schema.prisma`, `.env.example`).

## Security & Configuration Tips
Copy `.env.example` and `frontend/.env.example` for local setup. Never commit real API keys or local `.env` files. Ensure `VISION_PROVIDER` matches available credentials, and keep `CORS_ORIGIN` aligned with your frontend origin during local development.
