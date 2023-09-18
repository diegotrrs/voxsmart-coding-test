import request from 'supertest';
import app from '../server';
import { Server } from 'http';

describe('Random numbers average endpoint', () => {
  let server: Server;

  beforeAll(() => {
    server = app.listen(4000); // Use a different port that the app
  });

  afterAll(done => {
    server.close(done);
  });


  it('should return zero initially', async () => {
    const response = await request(app).get('/random-numbers-average');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('average');
    expect(response.body.average).toEqual(0);    
  });
});
