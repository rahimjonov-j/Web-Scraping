import express from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs.js";
import { getBrowser } from "./scraper/browser.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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
