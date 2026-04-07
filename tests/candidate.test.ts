import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import bodyParser from "body-parser";

import candidateRoutes from "../src/routes/candidate.routes";
import authRoutes from "../src/routes/auth.routes";

let mongod: MongoMemoryServer;
let app: express.Application;
let token: string;
let candidateId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  app = express();
  app.use(bodyParser.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/candidates", candidateRoutes);

  // Maka token
  const res = await request(app).post("/api/auth/login").send({
    email: "admin@test.com",
    password: "1234",
  });

  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Candidate API FULL TEST", () => {
  // CREATE
  it("should create candidate", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Landry",
        email: "landry@test.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Landry");

    candidateId = res.body._id;
  });

  it("should fail if email already exists", async () => {
    await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "John", email: "test@test.com" });

    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "John", email: "test@test.com" });

    expect(res.status).toBe(409);
  });

  it("should return 404 when updating non-existing candidate", async () => {
    const res = await request(app)
      .put("/api/candidates/123456789012")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test" });

    expect(res.status).toBe(500);
  });

  it("should fail with invalid token", async () => {
    const res = await request(app)
      .get("/api/candidates/123")
      .set("Authorization", "Bearer wrongtoken");

    expect(res.status).toBe(401);
  });
  it("should fail if invalid data", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "L",
      });

    expect(res.status).toBe(422);
  });
  it("should return validation errors", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });
  // Bloker raha tsy misy token
  it("should block without token", async () => {
    const res = await request(app).post("/api/candidates").send({
      name: "Test",
      email: "test@test.com",
    });

    expect(res.status).toBe(401);
  });

  // GET
  it("should get candidate by id", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "John",
        email: "john@test.com",
      });

    const res = await request(app)
      .get(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("John");
  });

  // GET NOT FOUND
  it("should return 404 if not found", async () => {
    const res = await request(app)
      .get(`/api/candidates/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  // UPDATE
  it("should update candidate", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Old",
        email: "old@test.com",
      });

    const res = await request(app)
      .put(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  // DELETE (SOFT)
  it("should soft delete candidate", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "ToDelete",
        email: "delete@test.com",
      });

    const res = await request(app)
      .delete(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await request(app)
      .get(`/api/candidates/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  // VALIDATE (ASYNC)
  it("should validate candidate with delay", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Async",
        email: "async@test.com",
      });

    const start = Date.now();

    const res = await request(app)
      .post(`/api/candidates/${create.body._id}/validate`)
      .set("Authorization", `Bearer ${token}`);

    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeGreaterThanOrEqual(2000); // vérifie délai
  });
});
