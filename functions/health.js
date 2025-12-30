export async function onRequest(context) {
  try {
    const bucket = context.env.BUCKET;
    const db = context.env.DB;

    if (!bucket) {
      return jsonResponse({ status: "error", error: "BUCKET binding is missing" }, 500);
    }

    // List up to 10 objects to prove read access and surface a snapshot of the bucket.
    const { objects = [], truncated = false, cursor = null } = await bucket.list({ limit: 10 });
    const keys = objects.map((o) => o.key);

    let d1 = null;
    if (db) {
      const row = await db.prepare("select sqlite_version() as sqlite_version, 1 as ok").first();
      d1 = {
        sqliteVersion: row?.sqlite_version ?? null,
        queryResult: row ?? null
      };
    }

    return jsonResponse({
      status: "ok",
      checkedAt: new Date().toISOString(),
      objectsFound: keys.length,
      truncated,
      cursor,
      keys,
      d1
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
