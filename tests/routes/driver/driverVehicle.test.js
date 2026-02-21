import request from 'supertest';
import express from 'express';

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Driver from '../../../models/driver.model.js';
import driverVehicleRouter from '../../../routes/driver/driverVehicle.router.js';

const app = express();
app.use(express.json());
app.use('/', driverVehicleRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    vehicle: { brand: 'Toyota', model: 'Corolla' },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Vehicle Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns vehicle details when found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockDriver()),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body.brand).toBe('Toyota');
        });

        it('returns 404 when vehicle not found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /:userId', () => {
        it('adds a vehicle successfully', async () => {
            const d = mockDriver({ vehicle: undefined });
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .post('/user1')
                .send({ brand: 'Honda', model: 'Civic' });
            expect(res.status).toBe(201);
            expect(d.vehicle.brand).toBe('Honda');
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 400 when vehicle already exists', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .post('/user1')
                .send({ brand: 'Honda', model: 'Civic' });
            expect(res.status).toBe(400);
        });
    });

    describe('PUT /:userId', () => {
        it('updates vehicle details successfully', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1')
                .send({ brand: 'Tesla' });
            expect(res.status).toBe(200);
            expect(d.vehicle.brand).toBe('Tesla');
            expect(d.save).toHaveBeenCalled();
        });
    });

    describe('DELETE /:userId', () => {
        it('removes vehicle successfully', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).delete('/user1');
            expect(res.status).toBe(200);
            expect(d.vehicle).toBeUndefined();
            expect(d.save).toHaveBeenCalled();
        });
    });
});
