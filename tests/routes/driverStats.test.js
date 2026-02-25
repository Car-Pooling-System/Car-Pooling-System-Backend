import request from 'supertest';
import express from 'express';

jest.mock('../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Driver from '../../models/driver.model.js';
import driverStatsRouter from '../../routes/driver/driverStats.router.js';

const app = express();
app.use(express.json());
app.use('/', driverStatsRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    rides: { hosted: 5, completed: 4, cancelled: 1 },
    hoursDriven: 20,
    distanceDrivenKm: 300,
    trustScore: 0,
    lastRideHostedAt: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Stats Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });

        it('returns driver stats when found', async () => {
            const d = mockDriver();
            Driver.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(d) });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
        });
    });

    describe('POST /:userId/hosted', () => {
        it('increments rides.hosted and updates lastRideHostedAt', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).post('/user1/hosted').send({});
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Ride hosted recorded');
            expect(d.rides.hosted).toBe(6);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).post('/unknown/hosted').send({});
            expect(res.status).toBe(404);
        });
    });

    describe('POST /:userId/completed', () => {
        it('returns 400 for non-positive hours', async () => {
            const res = await request(app)
                .post('/user1/completed')
                .send({ hours: 0, distanceKm: 100 });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid hours or distance');
        });

        it('returns 400 for non-positive distanceKm', async () => {
            const res = await request(app)
                .post('/user1/completed')
                .send({ hours: 2, distanceKm: 0 });
            expect(res.status).toBe(400);
        });

        it('updates completed count, hours, distance, and recalculates trust score', async () => {
            const d = mockDriver({
                rides: { hosted: 5, completed: 4, cancelled: 1 },
                hoursDriven: 20,
                distanceDrivenKm: 300,
                trustScore: 0,
            });
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .post('/user1/completed')
                .send({ hours: 2, distanceKm: 50 });
            expect(res.status).toBe(200);
            expect(d.rides.completed).toBe(5);
            expect(d.hoursDriven).toBe(22);
            expect(d.distanceDrivenKm).toBe(350);
            expect(d.trustScore).toBeGreaterThan(0);
            expect(d.save).toHaveBeenCalled();
        });
    });

    describe('POST /:userId/cancelled', () => {
        it('increments cancelled count and recalculates trust score', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).post('/user1/cancelled').send({});
            expect(res.status).toBe(200);
            expect(d.rides.cancelled).toBe(2);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).post('/unknown/cancelled').send({});
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:userId/reset', () => {
        it('resets all stats to zero', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).delete('/user1/reset');
            expect(res.status).toBe(200);
            expect(d.rides).toEqual({ hosted: 0, completed: 0, cancelled: 0 });
            expect(d.hoursDriven).toBe(0);
            expect(d.distanceDrivenKm).toBe(0);
            expect(d.trustScore).toBe(0);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).delete('/unknown/reset');
            expect(res.status).toBe(404);
        });
    });
});
