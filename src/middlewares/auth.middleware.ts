import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};