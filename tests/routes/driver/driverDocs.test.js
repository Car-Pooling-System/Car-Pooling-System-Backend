import request from 'supertest';
import express from 'express';

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Driver from '../../../models/driver.model.js';
import driverDocsRouter from '../../../routes/driver/driverDocs.router.js';

const app = express();
app.use(express.json());
app.use('/', driverDocsRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    documents: { drivingLicense: 'license.jpg' },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Documents Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns documents when found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockDriver()),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body.drivingLicense).toBe('license.jpg');
        });

        it('returns 404 when documents not found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });

        it('returns 500 on server error', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB Error')),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:userId', () => {
        it('updates documents successfully', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1')
                .send({ insurance: 'ins.jpg' });
            expect(res.status).toBe(200);
            expect(d.documents.insurance).toBe('ins.jpg');
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).put('/unknown').send({ insurance: 'ins.jpg' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:userId', () => {
        it('removes a specific document field', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .delete('/user1')
                .send({ field: 'drivingLicense' });
            expect(res.status).toBe(200);
            expect(d.documents.drivingLicense).toBeUndefined();
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 400 for invalid field', async () => {
            const res = await request(app)
                .delete('/user1')
                .send({ field: 'invalid' });
            expect(res.status).toBe(400);
        });

        it('returns 404 when documents not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app)
                .delete('/user1')
                .send({ field: 'drivingLicense' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:userId/all', () => {
        it('removes all documents', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).delete('/user1/all');
            expect(res.status).toBe(200);
            expect(d.documents).toEqual({});
            expect(d.save).toHaveBeenCalled();
        });
    });
});
