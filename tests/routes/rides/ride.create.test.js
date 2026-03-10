import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        find: jest.fn(),
    },
}));

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        updateOne: jest.fn(),
    },
}));

import Ride from '../../../models/ride.model.js';
import Driver from '../../../models/driver.model.js';
import rideCreateRouter from '../../../routes/rides/ride.create.router.js';

const app = express();
app.use(express.json());
app.use('/', rideCreateRouter);

const validBody = {
    driver: { userId: 'driver1' },
    vehicle: { brand: 'Toyota' },
    route: {
        start: { lat: 24.86, lng: 67.01 },
        end: { lat: 24.90, lng: 67.05 },
        encodedPolyline: '_p~iF~ps|U',
        gridsCovered: ['497_1340'],
    },
    schedule: { departureTime: new Date(Date.now() + 86400000).toISOString() },
    pricing: { baseFare: 200 },
    preferences: {},
    seats: { available: 3 },
    metrics: { totalDistanceKm: 10, durationMinutes: 30 },
};

describe('Ride Create Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /', () => {
        it('returns 400 when route data is invalid (missing start)', async () => {
            const body = { ...validBody, route: { ...validBody.route, start: null } };
            const res = await request(app).post('/').send(body);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid route data');
        });

        it('returns 400 when encodedPolyline is missing', async () => {
            const body = {
                ...validBody,
                route: { ...validBody.route, encodedPolyline: undefined },
            };
            const res = await request(app).post('/').send(body);
            expect(res.status).toBe(400);
        });

        it('returns 400 when gridsCovered is not an array', async () => {
            const body = {
                ...validBody,
                route: { ...validBody.route, gridsCovered: 'notAnArray' },
            };
            const res = await request(app).post('/').send(body);
            expect(res.status).toBe(400);
        });

        it('returns 409 when there is a scheduling conflict', async () => {
            const departureTime = validBody.schedule.departureTime;
            Ride.find.mockResolvedValue([
                {
                    _id: 'existingRide',
                    schedule: { departureTime },
                    metrics: { durationMinutes: 60 },
                },
            ]);
            const res = await request(app).post('/').send(validBody);
            expect(res.status).toBe(409);
            expect(res.body.message).toContain('already have a ride scheduled');
        });

        it('creates ride and returns 201 when no conflicts', async () => {
            Ride.find.mockResolvedValue([]);
            const mockRide = { _id: 'newRide', ...validBody };
            Ride.create.mockResolvedValue(mockRide);
            Driver.updateOne.mockResolvedValue({});

            const res = await request(app).post('/').send(validBody);
            expect(res.status).toBe(201);
            expect(Ride.create).toHaveBeenCalled();
            expect(Driver.updateOne).toHaveBeenCalled();
        });
    });
});
