# cf-labroom

Static “Hello, world” page deployed through Cloudflare Pages via GitHub Actions.

## Deploy
- Set GitHub repo secrets `CLOUDFLARE_API_TOKEN` (Pages write token), `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_PROJECT_NAME`.
- Push to `main` (or run the workflow manually) to trigger `.github/workflows/cloudflare-pages.yml`.
- The workflow publishes the repository root using `wrangler.jsonc` (`assets.directory: "."`); `.cfignore` keeps non-site files out of the bundle.

## Develop
- Edit `index.html`, then open it locally in a browser to preview.
