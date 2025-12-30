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
      return handleGoDemo(request, env);
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

let goWasmInstance;

async function handleGoDemo(request, env) {
  try {
    const name = new URL(request.url).searchParams.get("name") || "friend";
    const wasm = await loadGoWasm(request, env);
    const message = callGoGreet(wasm, name);
    return json({ status: "ok", from: "go-wasm", message });
  } catch (error) {
    return json(
      {
        status: "error",
        error: error.message ?? String(error),
        hint: "Ensure wasm/demo.wasm is built (tinygo build -o wasm/demo.wasm -target wasm ./wasm/demo.go) and deployed."
      },
      500
    );
  }
}

async function loadGoWasm(request, env) {
  if (goWasmInstance) return goWasmInstance;

  const assets = getAssets(env);
  if (!assets) throw new Error("ASSETS binding missing; ensure assets binding is configured.");

  const wasmUrl = new URL("/wasm/demo.wasm", request.url);
  const res = await assets.fetch(new Request(wasmUrl));
  if (!res.ok) {
    throw new Error(`wasm asset missing (status ${res.status})`);
  }
  const bytes = await res.arrayBuffer();
  const instantiated = await WebAssembly.instantiate(bytes, {});
  // WebAssembly.instantiate returns { module, instance }
  const instance = instantiated.instance ?? instantiated;
  goWasmInstance = {
    instance,
    exports: instance.exports,
    memory: instance.exports.memory,
  };
  return goWasmInstance;
}

function callGoGreet(wasm, name) {
  const { exports, memory } = wasm;
  if (!exports || !exports.alloc || !exports.greet || !exports.result_len) {
    throw new Error("greet/alloc/result_len exports not found");
  }

  const enc = new TextEncoder();
  const data = enc.encode(name);
  const ptr = exports.alloc(data.length);
  if (!ptr) throw new Error("allocation failed");

  const memView = new Uint8Array(memory.buffer, ptr, data.length);
  memView.set(data);

  const outPtr = exports.greet(ptr, data.length);
  const outLen = exports.result_len();
  if (!outPtr || !outLen) throw new Error("greet returned empty result");

  const outView = new Uint8Array(memory.buffer, outPtr, outLen);
  const dec = new TextDecoder();
  return dec.decode(outView);
}

function getAssets(env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS;
  }
  return null;
}
