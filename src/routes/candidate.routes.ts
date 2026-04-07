import express from "express";
import { createCandidate } from "../controllers/candidate.controller";
import { getCandidate } from "../controllers/candidate.controller";
import { updateCandidate } from "../controllers/candidate.controller";
import { deleteCandidate } from "../controllers/candidate.controller";
import { validateCandidate } from "../controllers/candidate.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
router.use(authMiddleware);

router.post("/:id/validate", validateCandidate);
router.delete("/:id", deleteCandidate);
router.put("/:id", updateCandidate);
router.get("/:id", getCandidate);
router.post("/", createCandidate);

export default router;