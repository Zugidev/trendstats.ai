export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/trends/all") {
      const res = await fetch("https://www.reddit.com/r/all/hot.json?limit=10", {
        headers: { "User-Agent": "trendstats" }
      });

      const data = await res.json();
      const trends = data.data.children.map(p => p.data.title).slice(0, 5);

      return new Response(JSON.stringify({
        success: true,
        insight: trends.join("\n"),
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("API çalışıyor 🚀");
  }
};
