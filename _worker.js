export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request);
    }

    return new Response("Hello from Cloudflare Pages!", {
      headers: { "content-type": "text/plain;charset=utf-8" },
    });
  },
};

async function handleLogin(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ status: "error", message: "invalid JSON payload" }, 400);
  }

  const { user, pwd } = body ?? {};
  if (user !== "admin") {
    return json({ status: "error", message: "invalid user or password" }, 401);
  }

  if (pwd !== currentClockPassword()) {
    return json({ status: "error", message: "invalid user or password" }, 401);
  }

  return json({ status: "ok", message: "authenticated", expires: `${currentClockPassword()} UTC` });
}

function currentClockPassword() {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json;charset=utf-8" },
  });
}
