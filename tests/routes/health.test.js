import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health.router.js';

const app = express();
app.use(express.json());
app.use('/', healthRouter);

describe('GET /health', () => {
    it('returns 200 with server running message', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Server is running');
    });
});
