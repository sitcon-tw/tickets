# Frontend (React + Vite)

This is a React rewrite of the Astro frontend.

- React Router for pages
- React Query for data fetching and caching
- Vite for dev/build

## Development

1. Install deps at repo root
2. Start backend so `/api` works (defaults to http://localhost:3000)
3. Start React dev server

Environment:
- If not using Vite proxy, set `VITE_BACKEND_URI` in `frontend/.env` (e.g., http://localhost:3000)

```bash
pnpm i
pnpm dev
```
