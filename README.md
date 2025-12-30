# cf-labroom

Static “Hello, world” page deployed through Cloudflare Pages via GitHub Actions.

## Deploy
- Set GitHub repo secrets `CLOUDFLARE_API_TOKEN` (Pages write token), `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_PROJECT_NAME`.
- Push to `main` (or run the workflow manually) to trigger `.github/workflows/cloudflare-pages.yml`.
- The workflow publishes the repository root using `wrangler.jsonc` (`assets.directory: "."`); `.cfignore` keeps non-site files out of the bundle.
- `.assetsignore` prevents `_worker.js` from being uploaded as a static asset; it remains the worker entrypoint.

## Develop
- Edit `index.html`, then open it locally in a browser to preview.

## R2 health check
- Endpoint: `GET /health` (served by `_worker.js`) attempts an R2 list and returns JSON.
- Binding: configure an R2 bucket binding named `BUCKET`.
  - Pages dashboard: Settings → Functions → R2 bindings → add `BUCKET` pointing to your bucket.
  - Workers (wrangler deploy): set `wrangler.jsonc` `r2_buckets[0].bucket_name` and deploy; `main` is `_worker.js`.
- Success response: `{"status":"ok","checkedAt":"..."}`
- Failure response: `{"status":"error","error":"..."}` with HTTP 500 when binding/credentials/bucket are invalid.
