# cf-labroom

A refreshed hello-world page for Cloudflare Pages. The landing hero now simply states the live endpoints for `/health`, `/health/d1`, and the Go→Wasm demo without additional links or extras.

## Deploy
- Set GitHub repo secrets `CLOUDFLARE_API_TOKEN` (Pages write token), `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_PROJECT_NAME`.
- Push to `main` (or run the workflow manually) to trigger `.github/workflows/cloudflare-pages.yml`.
- The workflow publishes the repository root using `wrangler.jsonc` (`assets.directory: "."`); `.cfignore` keeps non-site files out of the bundle.
- `.assetsignore` prevents `_worker.js` from being uploaded as a static asset; it remains the worker entrypoint.
- `assets.binding` is set to `ASSETS` in `wrangler.jsonc` so `_worker.js` can fetch static files (e.g., `wasm/demo.wasm`).

## Develop
- Edit `index.html`, then open it locally in a browser to preview.

## R2 health check
- Endpoint: `GET /health` (served by `_worker.js`) lists up to 10 R2 objects and returns JSON with keys/cursor/truncated.
- Binding: configure an R2 bucket binding named `BUCKET`.
  - Pages dashboard: Settings → Functions → R2 bindings → add `BUCKET` pointing to your bucket.
  - Workers (wrangler deploy): set `wrangler.jsonc` `r2_buckets[0].bucket_name` and deploy; `main` is `_worker.js`.
- Success response: `{"status":"ok","checkedAt":"..."}`
- Failure response: `{"status":"error","error":"..."}` with HTTP 500 when binding/credentials/bucket are invalid.

## D1 health check
- Endpoint: `GET /health/d1` runs a connectivity query (`select 1 as ok`) and lists up to 5 tables/views from `sqlite_master`.
- Binding: configure a D1 binding named `DB`.
  - Pages: Settings → Functions → D1 bindings → add `DB` pointing to your database.
  - Workers (wrangler deploy): set `wrangler.jsonc` `d1_databases[0].database_id` to your D1 database ID.
- Success response includes `queryResult` and `tables`; failures return status 500 with an error message.

## Automated health checks
- Workflow: `.github/workflows/health-check.yml` hits `/health` and `/health/d1`.
- Configure repo secret `HEALTH_BASE_URL` (e.g. `https://cf-labroom.heavenruler.workers.dev`).
- Trigger manually (`workflow_dispatch`) or wait for the daily scheduled run; failures surface in Actions.

## Go → Wasm demo
- Endpoint: `GET /demo/go?name=YourName` currently returns a JS stub message (no Wasm) and is linked from `index.html`.
- To enable a real Go→Wasm flow, build your own module (e.g., TinyGo: `tinygo build -o wasm/demo.wasm -target wasm ./wasm/demo.go`), commit it, and replace the stub logic in `_worker.js` to load and call the wasm.
