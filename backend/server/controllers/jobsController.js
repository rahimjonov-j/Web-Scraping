import { fetchJobs } from "../scraper/hhScraper.js";
import { getCached, setCached } from "../utils/cache.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const inflight = new Map();

export async function getJobs(req, res) {
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

  const task = fetchJobs(type)
    .then((data) => {
      setCached(type, data, CACHE_TTL_MS);
      return data;
    })
    .finally(() => inflight.delete(type));

  inflight.set(type, task);

  try {
    const data = await task;
    return res.json(data);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Scrape failed." });
  }
}
