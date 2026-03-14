import express from "express";
import jobsRouter from "./routes/jobs.js";
import { getBrowser } from "./scraper/browser.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Ruxsat berilgan originlar ro‘yxati
const allowedOrigins = new Set([
  "http://localhost:5173", // Vite local dev
  "http://localhost:3000", // optional local proxy/dev
  "https://web-scraping-hh.vercel.app", // Vercel frontend
]);

// CORS headerlarini hamma javobga qo'yish (xatoliklarda ham)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use("/api", jobsRouter);

app.get("/", (_req, res) => {
  res.send("Job Finder API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

getBrowser().catch((err) => {
  console.error("Failed to launch browser:", err);
});
