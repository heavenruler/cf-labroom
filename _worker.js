export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api") {
      return handleApiInfo();
    }

    if (url.pathname === "/demo") {
      return handleDemo();
    }

    const assets = getAssets(env);
    if (!assets) {
      return new Response(
        "Static assets binding (ASSETS) missing. Ensure wrangler 'assets' is configured and deployed.",
        { status: 500 }
      );
    }

    return assets.fetch(request, env, ctx);
  },
};

function handleApiInfo() {
  return json({
    message: "Worker demo — these are the available API hooks.",
    routes: [
      { path: "/api", description: "This document, describing each link." },
      { path: "/demo", description: "Returns demo payload that could wrap wasm or other services." },
    ],
    notes:
      "Expand `/demo` later to run wasm or chain to D1/R2; this pure JS version keeps the sample lightweight.",
  });
}

function handleDemo() {
  return json({
    message: "Demo handler can invoke any JS or wasm logic you wire up next.",
    capabilities: [
      "Respond quickly with JSON (the current stub).",
      "Load wasm/demo.wasm via WebAssembly.instantiate and marshal inputs/outputs.",
      "Call upstream APIs, D1, R2, KV, etc. once you add bindings and logic.",
    ],
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getAssets(env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS;
  }
  return null;
}
