# Repository instructions

- Maven and npm builds may resolve and download dependencies when necessary.
- Use Node.js 22 for the frontend and Java 25 for the backend.
- Before changing the frontend, install its locked dependencies with `cd frontend && npm ci`.
- Keep generated `*.components.json` manifests synchronized with their widget sources. Run `cd frontend && npm run check:components`; if it reports stale files, run `npm run generate:components` and commit the generated changes.
- When behavior or visible navigation changes, update the corresponding tests in the same change.
- Keep the root `Dockerfile` synchronized with changes to runtime versions, dependencies, modules, generated manifests, build outputs, and application packaging.
- Before finishing any code change, reproduce the complete CI sequence from the repository root:
  1. `cd frontend && npm test`
  2. `cd frontend && npm run build`
  3. Copy `frontend/dist/frontend/browser/` into `backend/application/src/main/resources/static/`.
  4. `cd backend && mvn --batch-mode --no-transfer-progress test package`
- When a change affects the Docker build, also verify it from the repository root with `docker build -t flow-ui-prototype .`.
- Do not report the task complete while any required test or build fails. Fix failures caused by the change and rerun the complete sequence.
