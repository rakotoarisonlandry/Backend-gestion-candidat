import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import bodyParser from "body-parser";

import candidateRoutes from "../src/routes/candidate.routes";
import authRoutes from "../src/routes/auth.routes";
import User from "../src/models/candidate.model";

let mongod: MongoMemoryServer;
let app: express.Application;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  app = express();
  app.use(bodyParser.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/candidates", candidateRoutes);

  await User.create({
    name: "user",
    email: "admin@test.com",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@test.com", password: "1234" });

  if (!res.body.token) {
    throw new Error(
      `beforeAll: login failed — status ${res.status}, body: ${JSON.stringify(res.body)}`
    );
  }

  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key === "users") continue;
    await collections[key].deleteMany({});
  }
});

describe("Candidate API FULL TEST", () => {

  it("should create candidate", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Landry", email: "landry@test.com" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Landry");
  });

  it("should fail if invalid data", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "L" });

    expect(res.status).toBe(422);
  });

  it("should block without token", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .send({ name: "Test", email: "test@test.com" });

    expect(res.status).toBe(401);
  });

  it("should get candidate by id", async () => {
    // Créer d'abord dans ce test (afterEach a nettoyé après le précédent)
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "John", email: "john@test.com" });

    expect(create.status).toBe(201); // garde-fou explicite

    const res = await request(app)
      .get(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("John");
  });

  it("should return 404 if not found", async () => {
    const res = await request(app)
      .get("/api/candidates/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should update candidate", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Old", email: "old@test.com" });

    expect(create.status).toBe(201);

    const res = await request(app)
      .put(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("should soft delete candidate", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ToDelete", email: "delete@test.com" });

    expect(create.status).toBe(201);

    const res = await request(app)
      .delete(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Vérifie que le candidat est bien "invisible" après soft delete
    const check = await request(app)
      .get(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it("should validate candidate with delay", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Async", email: "async@test.com" });

    expect(create.status).toBe(201);

    const start = Date.now();

    const res = await request(app)
      .post(`/api/candidates/${create.body._id}/validate`)
      .set("Authorization", `Bearer ${token}`);

    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeGreaterThanOrEqual(2000);
  }, 10_000); // timeout Jest augmenté pour ce test lent
});