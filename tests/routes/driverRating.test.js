import request from 'supertest';
import express from 'express';

jest.mock('../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));

import Driver from '../../models/driver.model.js';
import driverRatingRouter from '../../routes/driver/driverRating.router.js';

const app = express();
app.use(express.json());
app.use('/', driverRatingRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    rating: { average: 4.0, reviewsCount: 2 },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Rating Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns rating when driver found', async () => {
            const driver = { rating: { average: 4.5, reviewsCount: 10 } };
            Driver.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(driver) });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body.average).toBe(4.5);
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /:userId (add rating)', () => {
        it('returns 400 for rating < 1', async () => {
            const res = await request(app).post('/user1').send({ value: 0 });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Rating must be between 1 and 5');
        });

        it('returns 400 for rating > 5', async () => {
            const res = await request(app).post('/user1').send({ value: 6 });
            expect(res.status).toBe(400);
        });

        it('returns 400 when value is missing', async () => {
            const res = await request(app).post('/user1').send({});
            expect(res.status).toBe(400);
        });

        it('correctly calculates running average', async () => {
            const driver = mockDriver({ rating: { average: 4.0, reviewsCount: 2 } });
            Driver.findOne.mockResolvedValue(driver);
            // new rating = (4.0*2 + 5) / 3 = 4.33
            const res = await request(app).post('/user1').send({ value: 5 });
            expect(res.status).toBe(200);
            expect(driver.save).toHaveBeenCalled();
            expect(driver.rating.reviewsCount).toBe(3);
            expect(driver.rating.average).toBeCloseTo(4.33, 1);
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).post('/unknown').send({ value: 4 });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:userId (reset rating)', () => {
        it('resets rating to 0', async () => {
            const driver = mockDriver();
            Driver.findOne.mockResolvedValue(driver);
            const res = await request(app).delete('/user1');
            expect(res.status).toBe(200);
            expect(driver.rating.average).toBe(0);
            expect(driver.rating.reviewsCount).toBe(0);
            expect(driver.save).toHaveBeenCalled();
        });

        it('returns 404 if driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).delete('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
