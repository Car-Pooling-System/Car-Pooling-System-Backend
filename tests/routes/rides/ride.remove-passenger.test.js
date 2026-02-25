import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock('../../../models/user.model.js', () => ({
    __esModule: true,
    default: {
        updateOne: jest.fn(),
    },
}));

import Ride from '../../../models/ride.model.js';
import Rider from '../../../models/user.model.js';
import rideRemovePassengerRouter from '../../../routes/rides/ride.remove-passenger.router.js';

const app = express();
app.use(express.json());
app.use('/', rideRemovePassengerRouter);

const mockRide = (overrides = {}) => ({
    _id: 'ride1',
    driver: { userId: 'driver1' },
    passengers: [{ userId: 'rider1', status: 'confirmed', name: 'Alice' }],
    seats: { available: 1 },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Ride Remove Passenger Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /:rideId/remove-passenger', () => {
        it('removes passenger and updates rider booking status', async () => {
            const r = mockRide();
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .post('/ride1/remove-passenger')
                .send({ passengerId: 'rider1', driverId: 'driver1' });

            expect(res.status).toBe(200);
            expect(r.passengers[0].status).toBe('cancelled');
            expect(r.seats.available).toBe(2);
            expect(Rider.updateOne).toHaveBeenCalledWith(
                { userId: 'rider1', "bookings.rideId": 'ride1' },
                { $set: { "bookings.$.status": "cancelled" } }
            );
            expect(res.body.passengerName).toBe('Alice');
        });

        it('returns 400 when IDs are missing', async () => {
            const res = await request(app).post('/ride1/remove-passenger').send({});
            expect(res.status).toBe(400);
        });

        it('returns 403 for non-driver requester', async () => {
            Ride.findById.mockResolvedValue(mockRide());
            const res = await request(app)
                .post('/ride1/remove-passenger')
                .send({ passengerId: 'rider1', driverId: 'wrong_driver' });
            expect(res.status).toBe(403);
        });

        it('returns 404 when passenger is not found or not confirmed', async () => {
            const r = mockRide({ passengers: [] });
            Ride.findById.mockResolvedValue(r);
            const res = await request(app)
                .post('/ride1/remove-passenger')
                .send({ passengerId: 'rider1', driverId: 'driver1' });
            expect(res.status).toBe(404);
        });
    });
});
