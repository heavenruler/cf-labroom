export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return handleHealth(env);
    }

    // Fallback to static asset serving
    return env.ASSETS.fetch(request, env, ctx);
  },
};

async function handleHealth(env) {
  try {
    if (!env.BUCKET) {
      return json({ status: "error", error: "BUCKET binding is missing" }, 500);
    }

    await env.BUCKET.list({ limit: 1 });
    return json({ status: "ok", checkedAt: new Date().toISOString() });
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
