export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return handleHealth(env);
    }

    if (url.pathname === "/health/d1") {
      return handleD1Health(env);
    }

    if (url.pathname === "/demo/go") {
      return handleGoDemo();
    }

    // Fallback to static asset serving
    const assets = getAssets(env);
    if (!assets) {
      return new Response("Static assets binding (ASSETS) missing. Ensure wrangler 'assets' is configured and deployed.", { status: 500 });
    }
    return assets.fetch(request, env, ctx);
  },
};

async function handleHealth(env) {
  try {
    if (!env.BUCKET) {
      return json({ status: "error", error: "BUCKET binding is missing" }, 500);
    }

    // List up to 10 objects to prove read access and surface a snapshot of the bucket.
    const { objects = [], truncated = false, cursor = null } = await env.BUCKET.list({ limit: 10 });
    const keys = objects.map((o) => o.key);

    return json({
      status: "ok",
      checkedAt: new Date().toISOString(),
      objectsFound: keys.length,
      truncated,
      cursor,
      keys
    });
  } catch (error) {
    return json(
      { status: "error", error: error.message ?? String(error) },
      500
    );
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handleD1Health(env) {
  try {
    if (!env.DB) {
      return json({ status: "error", error: "DB binding is missing" }, 500);
    }

    // Simple query to verify connectivity and list a few tables.
    const row = await env.DB.prepare("select 1 as ok").first();
    const tables = await env.DB.prepare(
      "select name, type from sqlite_master where type in ('table','view') order by name limit 5"
    ).all();

    return json({
      status: "ok",
      checkedAt: new Date().toISOString(),
      queryResult: row ?? null,
      tables: tables?.results ?? [],
    });
  } catch (error) {
    return json(
      { status: "error", error: error.message ?? String(error) },
      500
    );
  }
}

function handleGoDemo() {
  return json({
    status: "ok",
    from: "go-demo-stub",
    message:
      "This is a JS stub. To enable real Go→Wasm, build and deploy wasm/demo.wasm (e.g., tinygo build -o wasm/demo.wasm -target wasm ./wasm/demo.go) then remove the stub in _worker.js."
  });
}

function getAssets(env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS;
  }
  return null;
}

function decodeBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
