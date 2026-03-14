import { Router } from "express";
import { getJobs } from "../controllers/jobsController.js";

const router = Router();

router.get("/jobs", getJobs);

export default router;
