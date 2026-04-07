import { Request, Response } from "express";
import Candidate from "../models/candidate.model";
import { candidateSchema } from "../utils/validation";
import { logger } from "../utils/logger";


export const createCandidate = async (req: Request, res: Response) => {
  try {
    // validation
    const data = candidateSchema.parse(req.body);

    const candidate = await Candidate.create(data);

    res.status(201).json(candidate);
    logger.info(
      {
        route: "/candidates",
        action: "create",
      },
      "Candidate created",
    );
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};
export const getCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json(candidate);
    logger.info(
      {
        route: "/candidates/:id",
        action: "get",
      },
      "Candidate retrieved",
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateCandidate = async (req: Request, res: Response) => {
  try {
    const data = candidateSchema.partial().parse(req.body);

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    logger.info(
      {
        route: "/candidates/:id",
        action: "update",
      },
      "Candidate updated",
    );
    res.json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json({ message: "Candidate deleted (soft)" });
    logger.info(
      {
        route: "/candidates/:id",
        action: "delete",
      },
      "Candidate deleted (soft)",
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
export const getAllCandidates = async (req : Request, res: Response) => {
  const candidates = await Candidate.find({ deletedAt: null });
  res.json(candidates);
};

export const validateCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    res.json({
      message: "Candidate validated",
      candidateId: candidate._id,
    });
    logger.info(
      {
        route: "/candidates/:id/validate",
        action: "validate",
      },
      "Candidate validated",
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
