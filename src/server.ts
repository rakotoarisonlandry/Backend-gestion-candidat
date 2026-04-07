import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import candidateRoutes from "./routes/candidate.routes";
import authRoutes from "./routes/auth.routes";
import rateLimit from "express-rate-limit";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173" , "https://frontend-gestion-candidat.onrender.com"],
  credentials: true,
}));

app.use(express.json());
app.use("/api/auth", rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "Too many requests",
}) , authRoutes
);
app.use("/api/candidates", rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "Too many requests",
}) , candidateRoutes
);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  });