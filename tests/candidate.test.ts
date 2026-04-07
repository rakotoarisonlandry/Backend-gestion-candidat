import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import candidateRoutes from '../src/routes/candidate.routes';
import bodyParser from 'body-parser';

let mongod: MongoMemoryServer;
let app: express.Application;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  app = express();
  app.use(bodyParser.json());
  app.use('/api/candidates', candidateRoutes);
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

describe('Candidate API', () => {
  it('should create a candidate', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .send({ name: 'Landry', email: 'landry@test.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Landry');
    expect(res.body.email).toBe('landry@test.com');
  });

  it('should fail validation if name too short', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .send({ name: 'L', email: 'test@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('too short');
  });
});