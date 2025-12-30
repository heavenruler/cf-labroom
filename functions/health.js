export async function onRequest(context) {
  try {
    const bucket = context.env.BUCKET;
    if (!bucket) {
      return jsonResponse({ status: "error", error: "BUCKET binding is missing" }, 500);
    }

    // Simple liveness check: attempt to list a single object. If the bucket or creds
    // are invalid, this will throw and surface the failure.
    await bucket.list({ limit: 1 });

    return jsonResponse({
      status: "ok",
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse(
      { status: "error", error: error.message ?? String(error) },
      500
    );
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
