export default {
  async fetch(request) {
    return new Response("Hello from Cloudflare Pages!", {
      headers: { "content-type": "text/plain;charset=utf-8" },
    });
  },
};
