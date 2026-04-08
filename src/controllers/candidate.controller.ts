import { Request, Response } from "express";
import Candidate from "../models/candidate.model";
import { candidateSchema } from "../utils/validation";
import { logger } from "../utils/logger";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";

const handleCandidateError = (error: unknown, res: Response): void => {
  if (error instanceof ZodError) {
    res.status(422).json({
      error: "echec de la validation",
      details: error.issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }
  const err = error as any;
  if (err.code === 11000 || err.cause?.code === 11000) {
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? {};
  const field = Object.keys(keyValue)[0];
  const value = keyValue[field];

  let message = `La valeur "${value}" est dejà utilisee pour le champ "${field}".`;

  if (field === "email") {
    message = `Cet email "${value}" est dejà utilise.`;
  }

  if (field === "username") {
    message = `Le nom d'utilisateur "${value}" est dejà pris.`;
  }

  res.status(409).json({
    error: "Conflit",
    code: "DUPLICATE_FIELD",
    field,
    value,
    message,
  });
  return;
}

  res.status(500).json({
    error: "Erreur interne du serveur",
    message: "Une erreur inattendue s'est produite. Veuillez reessayer plus tard.",
  });
};

export const createCandidate = async (req: Request, res: Response) => {
  try {
    const data = candidateSchema.parse(req.body);
    const candidate = await Candidate.create(data);

    res.status(201).json(candidate);
    logger.info({ route: "/candidates", action: "create" }, "Candidat cree");
  } catch (error: unknown) {
    handleCandidateError(error, res);
  }
};

export const getCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidat introuvable" });
    }

    res.json(candidate);
    logger.info({ route: "/candidates/:id", action: "get" }, "Candidat recupere");
  } catch (error: unknown) {
    handleCandidateError(error, res);
  }
};

export const updateCandidate = async (req: Request, res: Response) => {
  try {
    const data = candidateSchema.partial().parse(req.body);

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidat introuvable" });
    }

    logger.info({ route: "/candidates/:id", action: "update" }, "Candidat mis à jour");
    res.json(candidate);
  } catch (error: unknown) {
    handleCandidateError(error, res);
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
      return res.status(404).json({ error: "Candidat introuvable" });
    }

    res.json({ message: "Candidat supprime (soft delete)" });
    logger.info({ route: "/candidates/:id", action: "delete" }, "Candidat supprime (soft delete)");
  } catch (error: unknown) {
    handleCandidateError(error, res);
  }
};

export const getAllCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await Candidate.find({ deletedAt: null });
    res.json(candidates);
  } catch (error: unknown) {
    handleCandidateError(error, res);
  }
};

export const validateCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidat introuvable" });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    res.json({
      message: "Candidat valide",
      candidateId: candidate._id,
    });
    logger.info({ route: "/candidates/:id/validate", action: "validate" }, "Candidat valide");
  } catch (error: unknown) {
    handleCandidateError(error, res);
  }
};