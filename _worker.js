export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return htmlResponse(INDEX_HTML);
    }

    if (url.pathname === "/login" || url.pathname === "/login.html") {
      return htmlResponse(LOGIN_HTML);
    }

  if (url.pathname === "/api/login" && request.method === "POST") {
    return handleLogin(request);
  }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleLogin(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ status: "error", message: "invalid JSON payload" }, 400);
  }

  const { user, pwd, tz = "+0" } = body ?? {};
  if (user !== "admin") {
    return json({ status: "error", message: "invalid user or password" }, 401);
  }

  const offsetHours = parseTimezoneOffset(tz);
  if (offsetHours === null) {
    return json({ status: "error", message: "invalid timezone offset" }, 400);
  }

  const expectedPassword = currentClockPassword(offsetHours);

  if (pwd !== expectedPassword) {
    return json({ status: "error", message: "invalid user or password" }, 401);
  }

  return json({
    status: "ok",
    message: "authenticated",
    expires: `${expectedPassword} (${formatTimezone(offsetHours)})`
  });
}

function currentClockPassword(offsetHours = 0) {
  const now = new Date();
  const offsetMs = offsetHours * 60 * 60 * 1000;
  const target = new Date(now.getTime() + offsetMs);
  const hh = String(target.getUTCHours()).padStart(2, "0");
  const mm = String(target.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json;charset=utf-8" },
  });
}

function htmlResponse(body) {
  return new Response(body, {
    headers: { "content-type": "text/html;charset=utf-8" },
  });
}

function parseTimezoneOffset(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized === "") return null;
    const match = normalized.match(/^([+-]?)(\d{1,2})(?:[:.](\d{2}))?$/);
    if (!match) return null;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = match[3] ? Number(match[3]) : 0;
    if (hours > 14 || minutes >= 60) return null;
    const total = sign * (hours + minutes / 60);
    return total;
  }
  return null;
}

function formatTimezone(offsetHours) {
  if (offsetHours === 0) return "UTC";
  const sign = offsetHours >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetHours);
  const hh = Math.floor(absolute);
  const mm = (absolute - hh) * 60;
  const hhStr = String(hh).padStart(2, "0");
  const mmStr = mm ? String(mm).padStart(2, "0") : null;
  return `UTC${sign}${hhStr}${mmStr ? `:${mmStr}` : ""}`;
}

const INDEX_HTML = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cf-labroom API 使用說明</title>
  <style>
    body {
      font-family: "Noto Sans", "Segoe UI", sans-serif;
      background: #101123;
      color: #f8fafc;
      margin: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    main {
      width: min(740px, 100%);
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(94, 234, 212, 0.2);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 25px 60px rgba(2, 6, 23, 0.8);
    }
    h1 {
      margin-top: 0;
      font-size: clamp(2.25rem, 4vw, 2.85rem);
    }
    p {
      line-height: 1.6;
      color: #cbd5f5;
    }
    code {
      background: rgba(15, 23, 42, 0.7);
      border-radius: 6px;
      padding: 0.1rem 0.4rem;
      font-size: 0.95rem;
    }
    pre {
      background: rgba(15, 23, 42, 0.7);
      border-radius: 10px;
      padding: 1rem;
      overflow-x: auto;
    }
    ul {
      padding-left: 1.2rem;
      line-height: 1.6;
    }
    .note {
      background: rgba(79, 70, 229, 0.15);
      border: 1px solid rgba(79, 70, 229, 0.4);
      border-radius: 10px;
      padding: 1rem;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <main>
    <h1>cf-labroom API 說明</h1>
    <p>此專案在 <code>/api/login</code> 提供簡單的 login check API，密碼會每分鐘以 UTC 的時間動態變化，實作如下：</p>
    <ul>
      <li><strong>HTTP 方法</strong>：<code>POST /api/login</code></li>
      <li><strong>請求內容</strong>：JSON 格式，欄位 <code>user</code>、<code>pwd</code>，以及選填的 <code>tz</code>（預設 <code>"+0"</code>）；範例 <code>{ "user": "admin", "pwd": "14:07", "tz": "+8" }</code>。</li>
      <li><strong>密碼規則</strong>：以 UTC 加上 <code>tz</code> 偏移（小時）計算當前 <code>hh:mm</code>，例如 <code>tz="+8"</code> 會用 UTC+8 的時間。</li>
      <li><strong>使用者</strong>：唯一接受 <code>admin</code>。</li>
    </ul>
    <h2>範例請求（curl）</h2>
    <pre><code>curl -X POST https://your-domain.example/api/login \\
-H "Content-Type: application/json" \\
-d '{"user":"admin","pwd":"HH:MM","tz":"+8"}'</code></pre>
    <p>請將 <code>HH:MM</code> 換成你送出請求時的 <strong>UTC + tz</strong> 小時與分鐘，且要補零。</p>
    <h2>回應範例</h2>
    <pre><code>{
  "status": "ok",
  "message": "authenticated",
  "expires": "HH:MM UTC"
}</code></pre>
    <div class="note">
      <p>密碼是時間敏感的，因此使用者應每分鐘重新取得新密碼。若密碼不正確或使用者錯誤，API 會回傳 401 錯誤及 <code>invalid user or password</code> 訊息；若時區格式錯誤會回傳 400。</p>
      <p>這個登入端點目前不做儲存，僅為 demo；你可以在 worker 中加入更完整的 session/令牌邏輯或接後端服務。</p>
    </div>
  </main>
</body>
</html>`;

const LOGIN_HTML = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cf-labroom Login Demo</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(180deg, #0f172a, #020617);
      color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: "Noto Sans", "Segoe UI", sans-serif;
    }
    main {
      width: min(420px, 100%);
      background: rgba(15, 23, 42, 0.9);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(2, 6, 23, 0.9);
      border: 1px solid rgba(79, 70, 229, 0.3);
    }
    h1 {
      margin-top: 0;
      font-size: clamp(1.75rem, 3vw, 2.4rem);
    }
    label {
      display: block;
      margin-bottom: 0.35rem;
      font-weight: 600;
    }
    input {
      width: 100%;
      padding: 0.65rem 0.75rem;
      margin-bottom: 1rem;
      border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: rgba(15, 23, 42, 0.6);
      color: #e2e8f0;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      border: none;
      background: linear-gradient(90deg, #38bdf8, #6366f1);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
    }
    button:disabled {
      opacity: 0.6;
      cursor: wait;
    }
    .status {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.4);
    }
    .status.success {
      border-color: rgba(34, 197, 94, 0.6);
      color: #34d399;
    }
    .status.error {
      border-color: rgba(248, 113, 113, 0.6);
      color: #f87171;
    }
    small {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <main>
    <h1>登入測試</h1>
    <p>輸入 user 並使用當前 <strong>指定時區</strong> 的 <code>hh:mm</code> 作為密碼（每分鐘變化），預設為 UTC+8。</p>
    <form id="login">
      <label for="user">使用者</label>
      <input id="user" name="user" value="admin" required />

      <label for="pwd">密碼（UTC hh:mm）</label>
      <input id="pwd" name="pwd" placeholder="例: 03:45" pattern="\\d{2}:\\d{2}" required />

      <label for="tz">時區偏移（小時）</label>
      <input id="tz" name="tz" value="+8" pattern="[+-]?\\d{1,2}" />

      <button type="submit">送出</button>
    </form>
    <div id="status" class="status" hidden></div>
  </main>

  <script>
    const form = document.getElementById("login");
    const statusEl = document.getElementById("status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.className = "status";
      const button = form.querySelector("button");
      button.disabled = true;

      const payload = {
        user: form.user.value,
        pwd: form.pwd.value,
        tz: form.tz.value ?? "+8",
      };

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        statusEl.hidden = false;
        statusEl.textContent = JSON.stringify(data, null, 2);
        statusEl.classList.add(response.ok ? "success" : "error");
      } catch (error) {
        statusEl.hidden = false;
        statusEl.textContent = "請求失敗：" + error.message;
        statusEl.classList.add("error");
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`;
