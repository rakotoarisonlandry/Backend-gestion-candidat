import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  // user fake ho testena
  if (email === "admin@test.com" && password === "1234") {
    const token = jwt.sign(
      { userId: 1 },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
};