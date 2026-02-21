import request from 'supertest';
import express from 'express';

// Mock Driver model
jest.mock('../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));

import Driver from '../../models/driver.model.js';
import driverRegistrationRouter from '../../routes/driver/driverRegistration.router.js';

const app = express();
app.use(express.json());
app.use('/', driverRegistrationRouter);

describe('Driver Registration Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /:userId', () => {
        it('returns 200 when driver already registered', async () => {
            Driver.findOne.mockResolvedValue({ userId: 'user1', toObject: () => ({}) });
            const res = await request(app).post('/user1').send({});
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Driver already registered');
        });

        it('creates and returns 201 for new driver', async () => {
            Driver.findOne.mockResolvedValue(null);
            Driver.create.mockResolvedValue({ userId: 'user2', verification: {} });
            const res = await request(app).post('/user2').send({});
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Driver registered successfully');
        });

        it('returns 500 on DB error', async () => {
            Driver.findOne.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).post('/userX').send({});
            expect(res.status).toBe(500);
        });
    });

    describe('GET /:userId', () => {
        it('returns 200 with driver data when found', async () => {
            Driver.findOne.mockResolvedValue({ userId: 'user1' });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Driver not found');
        });
    });

    describe('DELETE /:userId', () => {
        it('returns 200 when driver deleted successfully', async () => {
            Driver.findOneAndDelete.mockResolvedValue({ userId: 'user1' });
            const res = await request(app).delete('/user1');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Driver deleted successfully');
        });

        it('returns 404 when driver not found for delete', async () => {
            Driver.findOneAndDelete.mockResolvedValue(null);
            const res = await request(app).delete('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
