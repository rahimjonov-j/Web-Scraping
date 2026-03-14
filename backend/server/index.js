import express from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs.js";
import { getBrowser } from "./scraper/browser.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Ruxsat berilgan originlar ro‘yxati
const allowedOrigins = [
  "http://localhost:5173", // Vite local dev
  "http://localhost:3000", // optional local proxy/dev
  "https://javohirweb-scraping.vercel.app", // Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // origin null bo‘lishi mumkin (postman yoki server-to-server request)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: origin not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // cookie yoki authorization header uchun
  }),
);
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
