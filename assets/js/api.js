
window.Api = {
  async request(action, payload = {}, method = "POST") {
    if (window.APP_CONFIG.sampleMode) {
      return { success: true, action, data: null, source: "sample" };
    }
    const url = window.APP_CONFIG.apiBaseUrl;
    if (!url || url.startsWith("PUT_")) throw new Error("API URL is not configured.");
    if (method === "GET") {
      const qs = new URLSearchParams({ action, ...payload }).toString();
      const response = await fetch(`${url}?${qs}`);
      return response.json();
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    return response.json();
  }
};
