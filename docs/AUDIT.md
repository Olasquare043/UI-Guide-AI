# Repository Audit

Date: 2026-02-10

## Architecture Overview

- Frontend: Vite + React (JSX), Tailwind CSS, Axios, React Markdown.
- Backend: FastAPI + LangGraph (LLM orchestration), LangChain, ChromaDB vector store, OpenAI embeddings and chat model.
- Data: PDF documents in `backend/docs/` indexed into `backend/chroma_db/`.
- API: `/chat` for answers, `/documents` for available docs, `/test-vector` for vector store status, `/health` for monitoring.

## Current UX Issues

- Single page chat UI with limited information architecture; no clear landing page or navigation.
- Mobile usability: sidebar and layout are desktop-centric; body overflow locked.
- Missing empty states for first-time users and error recovery messaging is inconsistent.
- Visual identity is inconsistent, with duplicated CSS and mixed typography.
- Accessibility gaps: missing landmarks, keyboard focus cues, and form labeling.

## Technical Debt and Risks

- Secrets present in local `.env` file. Needs `.env.example` and removal of secrets.
- Backend imports initialize LLM at import time, which complicates tests and health checks without env vars.
- Frontend API client logs to console in production; no abort or retry support.
- No test setup; CI not configured.
- Lint failures in frontend (`frontend/src/App.jsx`).
- README duplicated content and has encoding issues.

## Quick Wins

- Remove secrets and add `.env.example` files.
- Add layout shell, responsive navigation, and foundational routes.
- Fix lint errors and remove unused variables.
- Introduce consistent typography and design tokens.

## Deeper Refactors

- Restructure frontend into pages and components, introduce router.
- Add guided walkthrough workflow with stepper state machine.
- Centralize API client with consistent error handling, abort, and retry.
- Introduce validation, tests, and CI.

## Baseline Checks (Recorded Outputs)

Frontend `npm install`:

```
up to date, audited 360 packages in 4s

141 packages are looking for funding
  run `npm fund` for details

1 high severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```

Frontend `npm run build`:

```
vite v7.3.1 building client environment for production...
transforming...
✓ 2005 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.46 kB │ gzip: 0.29 kB
dist/assets/index-DCwC9ibT.css  23.21 kB │ gzip: 5.18 kB
dist/assets/index-Bna2jKNv.js  410.42 kB │ gzip: 129.84 kB
✓ built in 8.18s
```

Frontend `npm run lint`:

```
frontend/src/App.jsx
  175:10  error  'connectionStatus' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u   no-unused-vars
  177:10  error  'documentInfo' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u       no-unused-vars
  178:10  error  'vectorStoreStatus' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

✖ 3 problems (3 errors, 0 warnings)
```

Backend `python -m pytest`:

```
command timed out after 14012 milliseconds
```

## Proposed Upgrade Plan

Milestone 1: Foundation

- Add routing, app shell, and responsive navigation.
- Introduce design tokens, typography, and layout system.
- Remove secret files and add `.env.example`.

Milestone 2: UX and Workflow

- Create landing page, guided walkthrough page, history page, and about/FAQ page.
- Add empty, loading, and error states.
- Implement toasts and notifications.

Milestone 3: Reliability and Data

- Centralize API client with abort + retry + typed shapes.
- Add frontend validation and backend request validation.
- Improve backend initialization to avoid import-time failures.

Milestone 4: Product Features

- Guided walkthrough output with steps, notes, and copy/export.
- History with rename/delete and local persistence.
- Feedback controls and verbosity preferences.

Milestone 5: Quality and Docs

- Add lint/formatters and minimal tests.
- Add CI workflow.
- Update README and add docs/DECISIONS.md.
