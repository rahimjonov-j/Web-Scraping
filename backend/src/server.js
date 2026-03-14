import express from "express";
import cors from "cors";
import { scrapeJobs } from "./scraper.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_TTL_MS = 5 * 60 * 1000;

app.use(cors());

const cache = new Map();
const inflight = new Map();

function getCached(type) {
  const entry = cache.get(type);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(type);
    return null;
  }
  return entry.data;
}

function setCached(type, data) {
  cache.set(type, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

app.get("/api/jobs", async (req, res) => {
  const type = String(req.query.type || "");

  const cached = getCached(type);
  if (cached) {
    return res.json(cached);
  }

  if (inflight.has(type)) {
    try {
      const data = await inflight.get(type);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message || "Scrape failed." });
    }
  }

  const scrapePromise = scrapeJobs(type)
    .then((data) => {
      setCached(type, data);
      return data;
    })
    .finally(() => inflight.delete(type));

  inflight.set(type, scrapePromise);

  try {
    const data = await scrapePromise;
    return res.json(data);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Scrape failed." });
  }
});

app.get("/", (_req, res) => {
  res.send("Job Finder API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
