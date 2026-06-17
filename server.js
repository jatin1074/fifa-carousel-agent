const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Proxy: Claude API ──────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
    }
    const { messages, useSearch, maxTokens } = req.body;

    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens || 2000,
      messages,
    };
    if (useSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: Pexels image search ─────────────────────────────────────
app.get("/api/pexels", async (req, res) => {
  try {
    if (!PEXELS_API_KEY) {
      return res.status(500).json({ error: "PEXELS_API_KEY not configured on server" });
    }
    const query = req.query.query || "football";
    const orientation = req.query.orientation || "portrait";
    const page = req.query.page || "1";

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=${orientation}`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: Ideogram image generation (optional, for the other agent) ──
app.post("/api/ideogram", async (req, res) => {
  try {
    const apiKey = req.headers["x-ideogram-key"];
    if (!apiKey) {
      return res.status(400).json({ error: "Missing X-Ideogram-Key header" });
    }
    const response = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: fetch an external image and serve it same-origin (avoids canvas CORS taint) ──
app.get("/api/image-proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("Missing url param");
    // Basic safety: only allow pexels CDN
    if (!/^https:\/\/images\.pexels\.com\//.test(url)) {
      return res.status(400).send("URL not allowed");
    }
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).send("Failed to fetch image");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    anthropicConfigured: !!ANTHROPIC_API_KEY,
    pexelsConfigured: !!PEXELS_API_KEY,
  });
});

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`FIFA 2026 Carousel Agent running on port ${PORT}`);
});
