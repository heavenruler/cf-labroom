# cf-labroom (hello-world)

This repo now contains a minimal Cloudflare Pages worker that responds with
"Hello from Cloudflare Pages!" on every request. Deploy with `wrangler publish`
or run locally with `wrangler dev`.

The workflow is simple:
1. `wrangler dev` to iterate locally.
2. `wrangler publish` to push to Cloudflare, which serves `_worker.js` on every
   incoming page request.
