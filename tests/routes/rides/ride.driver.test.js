import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        updateOne: jest.fn(),
    },
}));

jest.mock('../../../models/user.model.js', () => ({
    __esModule: true,
    default: {
        updateOne: jest.fn(),
    },
}));

import Ride from '../../../models/ride.model.js';
import Driver from '../../../models/driver.model.js';
import Rider from '../../../models/user.model.js';
import rideDriverRouter from '../../../routes/rides/ride.driver.router.js';

const app = express();
app.use(express.json());
app.use('/', rideDriverRouter);

const mockRide = (overrides = {}) => ({
    _id: 'ride1',
    driver: { userId: 'driver1' },
    passengers: [{ userId: 'rider1', status: 'confirmed' }],
    seats: { available: 2 },
    status: 'scheduled',
    schedule: { departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24h from now
    preferences: {},
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Ride Driver Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /:rideId/remove-passenger', () => {
        it('removes passenger successfully', async () => {
            const r = mockRide();
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .post('/ride1/remove-passenger')
                .send({ passengerUserId: 'rider1', driverUserId: 'driver1' });
            expect(res.status).toBe(200);
            expect(r.passengers[0].status).toBe('cancelled');
            expect(r.seats.available).toBe(3);
            expect(Rider.updateOne).toHaveBeenCalled();
        });

        it('returns 403 for unauthorized driver', async () => {
            Ride.findById.mockResolvedValue(mockRide());
            const res = await request(app)
                .post('/ride1/remove-passenger')
                .send({ passengerUserId: 'rider1', driverUserId: 'wrong_driver' });
            expect(res.status).toBe(403);
        });
    });

    describe('POST /:rideId/cancel', () => {
        it('cancels ride successfully', async () => {
            const r = mockRide();
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .post('/ride1/cancel')
                .send({ driverUserId: 'driver1' });
            expect(res.status).toBe(200);
            expect(r.status).toBe('cancelled');
            expect(Driver.updateOne).toHaveBeenCalled();
            expect(Rider.updateOne).toHaveBeenCalled();
        });

        it('returns 400 when cancelling within 6 hours', async () => {
            const r = mockRide({ schedule: { departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000) } });
            Ride.findById.mockResolvedValue(r);
            const res = await request(app).post('/ride1/cancel').send({ driverUserId: 'driver1' });
            expect(res.status).toBe(400);
        });
    });

    describe('PUT /:rideId/preferences', () => {
        it('updates preferences successfully', async () => {
            const r = mockRide({ passengers: [] }); // No confirmed passengers
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .put('/ride1/preferences')
                .send({ driverUserId: 'driver1', preferences: { smoking: false } });
            expect(res.status).toBe(200);
            expect(r.preferences.smoking).toBe(false);
        });

        it('returns 400 if passengers have already booked', async () => {
            const r = mockRide();
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .put('/ride1/preferences')
                .send({ driverUserId: 'driver1', preferences: { smoking: false } });
            expect(res.status).toBe(400);
        });
    });
});
