import request from 'supertest';
import express from 'express';

jest.mock('../../models/user.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Rider from '../../models/user.model.js';
import riderRidesRouter from '../../routes/rider/rider.rides.router.js';

const app = express();
app.use(express.json());
app.use('/', riderRidesRouter);

describe('Rider Rides Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns empty array when rider not found', async () => {
            Rider.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('returns mapped bookings list for existing rider', async () => {
            const rideDoc = {
                _id: 'ride1',
                schedule: { departureTime: new Date().toISOString() },
            };
            Rider.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    userId: 'user1',
                    bookings: [
                        {
                            _id: 'booking1',
                            rideId: rideDoc,
                            farePaid: 200,
                            status: 'confirmed',
                            bookedAt: new Date(),
                        },
                    ],
                }),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('bookingId');
            expect(res.body[0]).toHaveProperty('farePaid');
            expect(res.body[0]).toHaveProperty('status');
        });

        it('filters out bookings where rideId is missing', async () => {
            Rider.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    userId: 'user1',
                    bookings: [
                        { _id: 'booking1', rideId: null, farePaid: 100, status: 'confirmed', bookedAt: new Date() },
                        { _id: 'booking2', rideId: { _id: 'ride2' }, farePaid: 300, status: 'confirmed', bookedAt: new Date() },
                    ],
                }),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it('returns 500 on unexpected error', async () => {
            Rider.findOne.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB error')),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(500);
        });
    });
});
