import request from 'supertest';
import express from 'express';

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

import Driver from '../../../models/driver.model.js';
import driverVehiclesRouter from '../../../routes/driver/driverVehicles.router.js';

const app = express();
app.use(express.json());
app.use('/', driverVehiclesRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    vehicles: [{ brand: 'Toyota', model: 'Corolla', year: '2020', color: 'White', licensePlate: 'ABC-123' }],
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Multiple Vehicles Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns all vehicles for a driver', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockDriver()),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body.vehicles.length).toBe(1);
        });
    });

    describe('POST /:userId', () => {
        it('adds a new vehicle and creates driver if not exists', async () => {
            Driver.findOne.mockResolvedValue(null);
            const d = mockDriver({ vehicles: [] });
            Driver.create.mockResolvedValue(d);

            const res = await request(app)
                .post('/user1')
                .send({ brand: 'Honda', model: 'Civic', year: '2021', color: 'Black', licensePlate: 'XYZ-789' });

            expect(res.status).toBe(201);
            expect(d.vehicles.length).toBe(1);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 400 for missing fields', async () => {
            const res = await request(app).post('/user1').send({ brand: 'Honda' });
            expect(res.status).toBe(400);
        });
    });

    describe('PUT /:userId/:vehicleIndex', () => {
        it('updates a specific vehicle by index', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1/0')
                .send({ color: 'Red' });
            expect(res.status).toBe(200);
            expect(d.vehicles[0].color).toBe('Red');
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 for invalid index', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).put('/user1/1').send({ color: 'Red' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:userId/:vehicleIndex', () => {
        it('removes a specific vehicle by index', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).delete('/user1/0');
            expect(res.status).toBe(200);
            expect(d.vehicles.length).toBe(0);
            expect(d.save).toHaveBeenCalled();
        });
    });
});
