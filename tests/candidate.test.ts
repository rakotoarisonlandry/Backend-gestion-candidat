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
  const res = await request(app)
    .post("/api/auth/login")
    .send({
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

  // CREATE test tokony tsy mety raha data tsy valid 
  it("should fail if invalid data", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "L",
      });

    expect(res.status).toBe(422);
  });
   
  // Bloker raha tsy misy token
  it("should block without token", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .send({
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

  it("should return 500 on server error", async () => {
  jest.spyOn(mongoose.Model, 'find').mockImplementationOnce(() => {
    throw new Error("DB Error");
  });

  const res = await request(app)
    .get("/api/candidates")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(500);
});

it("should return 401 for invalid credentials", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@test.com", password: "WRONG_PASSWORD" });

  expect(res.status).toBe(401);
});

  it("should validate candidate with delay", async () => {
    const create = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ValidMe", email: "valid@test.com" });

    const res = await request(app)
      .post(`/api/candidates/${create.body._id}/validate`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Candidat validé");
  }, 10000); 


    it("should return 404 for update/delete/validate on non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const resUpdate = await request(app)
      .put(`/api/candidates/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "NoOne" });
    
    const resDelete = await request(app)
      .delete(`/api/candidates/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    const resValidate = await request(app)
      .post(`/api/candidates/${fakeId}/validate`)
      .set("Authorization", `Bearer ${token}`);

    expect(resUpdate.status).toBe(404);
    expect(resDelete.status).toBe(404);
    expect(resValidate.status).toBe(404);
  });


 it("should return 409 for duplicate email", async () => {
  const validData = { 
    name: "John Doe",           
    email: "unique@gmail.com"  
  };
  
  const firstResponse = await request(app)
    .post("/api/candidates")
    .set("Authorization", `Bearer ${token}`)
    .send(validData);
  
  expect(firstResponse.status).toBe(201);

  const res = await request(app)
    .post("/api/candidates")
    .set("Authorization", `Bearer ${token}`)
    .send(validData);

  expect(res.status).toBe(409);
  expect(res.body.code).toBe("DUPLICATE_FIELD");
});


  it("should return 404 for non-existent candidate", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  
  const res = await request(app)
    .get(`/api/candidates/${fakeId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(404);
});


  it("should return 409 for duplicate email", async () => {
  const candidateData = { 
    email: "unique@test.com", 
    username: "user1", 
    fullName: "Test User" 
  };
  
  await request(app)
    .post("/api/candidates")
    .set("Authorization", `Bearer ${token}`)
    .send(candidateData);

  const res = await request(app)
    .post("/api/candidates")
    .set("Authorization", `Bearer ${token}`)
    .send(candidateData);

  expect(res.status).toBe(409);
  expect(res.body.code).toBe("DUPLICATE_FIELD");
});


  it("should return 422 if validation fails (ZodError)", async () => {
  const res = await request(app)
    .post("/api/candidates")
    .set("Authorization", `Bearer ${token}`)
    .send({ email: "invalid-email" }); // Manque des champs obligatoires + email invalide

  expect(res.status).toBe(422);
  expect(res.body.error).toBe("Échec de la validation");
});

});