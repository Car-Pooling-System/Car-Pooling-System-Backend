import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: { findById: jest.fn() },
}));

jest.mock('../../../models/user.model.js', () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn().mockResolvedValue({}),
        updateOne: jest.fn().mockResolvedValue({}),
    },
}));

import Ride from '../../../models/ride.model.js';
import Rider from '../../../models/user.model.js';
import rideCancelRouter from '../../../routes/rides/ride.cancel.router.js';

const app = express();
app.use(express.json());
app.use('/', rideCancelRouter);

const mockRide = (overrides = {}) => ({
    _id: 'ride1',
    driver: { userId: 'driver1' },
    passengers: [],
    seats: { available: 2 },
    status: 'scheduled',
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Ride Cancel Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /:rideId/cancel', () => {
        it('returns 400 when userId is missing', async () => {
            const res = await request(app).post('/ride1/cancel').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('User ID is required');
        });

        it('returns 404 when ride not found', async () => {
            Ride.findById.mockResolvedValue(null);
            const res = await request(app).post('/ride1/cancel').send({ userId: 'u1' });
            expect(res.status).toBe(404);
        });

        it('driver cancels ride: sets status to cancelled and cancels all passengers', async () => {
            const ride = mockRide({
                driver: { userId: 'driver1' },
                passengers: [
                    { userId: 'p1', status: 'confirmed' },
                    { userId: 'p2', status: 'confirmed' },
                ],
            });
            Ride.findById.mockResolvedValue(ride);
            const res = await request(app)
                .post('/ride1/cancel')
                .send({ userId: 'driver1' });
            expect(res.status).toBe(200);
            expect(ride.status).toBe('cancelled');
            expect(ride.passengers[0].status).toBe('cancelled');
            expect(ride.passengers[1].status).toBe('cancelled');
            expect(ride.save).toHaveBeenCalled();
            expect(Rider.updateMany).toHaveBeenCalled();
        });

        it('passenger cancels: increases available seat and updates their booking', async () => {
            const ride = mockRide({
                passengers: [{ userId: 'p1', status: 'confirmed', farePaid: 200 }],
                seats: { available: 1 },
            });
            Ride.findById.mockResolvedValue(ride);
            const res = await request(app)
                .post('/ride1/cancel')
                .send({ userId: 'p1' });
            expect(res.status).toBe(200);
            expect(ride.passengers[0].status).toBe('cancelled');
            expect(ride.seats.available).toBe(2);
            expect(ride.save).toHaveBeenCalled();
            expect(Rider.updateOne).toHaveBeenCalled();
        });

        it('returns 404 when passenger booking not found or already cancelled', async () => {
            const ride = mockRide({
                passengers: [{ userId: 'p2', status: 'cancelled' }],
            });
            Ride.findById.mockResolvedValue(ride);
            const res = await request(app)
                .post('/ride1/cancel')
                .send({ userId: 'p2' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Booking not found or already cancelled');
        });
    });
});
