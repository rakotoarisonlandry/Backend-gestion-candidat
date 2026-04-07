import express from "express";
import { createCandidate, getAllCandidates } from "../controllers/candidate.controller";
import { getCandidate } from "../controllers/candidate.controller";
import { updateCandidate } from "../controllers/candidate.controller";
import { deleteCandidate } from "../controllers/candidate.controller";
import { validateCandidate } from "../controllers/candidate.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/:id/validate",authMiddleware,  validateCandidate);
router.delete("/:id",authMiddleware,  deleteCandidate);
router.put("/:id", authMiddleware, updateCandidate);
router.get("/:id",authMiddleware,  getCandidate);
router.get("/", authMiddleware, getAllCandidates);
router.post("/", authMiddleware, createCandidate);

export default router;