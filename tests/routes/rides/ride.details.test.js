import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: { findById: jest.fn() },
}));

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Ride from '../../../models/ride.model.js';
import Driver from '../../../models/driver.model.js';
import rideDetailsRouter from '../../../routes/rides/ride.details.router.js';

const app = express();
app.use(express.json());
app.use('/', rideDetailsRouter);

const ENCODED = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'; // 3 decoded points

const mockRideDoc = (overrides = {}) => {
    const obj = {
        _id: 'ride1',
        driver: { userId: 'driver1', name: 'John' },
        vehicle: {},
        route: { encodedPolyline: ENCODED },
        pricing: { baseFare: 300 },
        metrics: { totalDistanceKm: 15 },
        seats: { available: 2 },
        schedule: {},
        preferences: {},
        passengers: [],
        ...overrides,
    };
    return {
        ...obj,
        toObject: () => ({ ...obj, driver: { ...obj.driver } }),
    };
};

const mockDriverRecord = (overrides = {}) => ({
    verification: {
        emailVerified: true,
        phoneVerified: true,
        drivingLicenseVerified: true,
        vehicleVerified: true,
    },
    rating: { average: 4.5, reviewsCount: 10 },
    rides: { hosted: 20 },
    vehicles: [{ brand: 'Toyota', model: 'Corolla', year: '2020', color: 'White', licensePlate: 'ABC-123', images: [] }],
    ...overrides,
});

describe('Ride Details Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:rideId', () => {
        it('returns 404 when ride not found', async () => {
            Ride.findById.mockResolvedValue(null);
            const res = await request(app).get('/ride1');
            expect(res.status).toBe(404);
        });

        it('returns ride with driver verification flags', async () => {
            Ride.findById.mockResolvedValue(mockRideDoc());
            Driver.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockDriverRecord()) });
            const res = await request(app).get('/ride1');
            expect(res.status).toBe(200);
            expect(res.body.ride.driver.isVerified).toBe(true);
            expect(res.body.ride.driver.verificationDetails).toBeDefined();
        });

        it('returns isVerified=false when driver record is not found', async () => {
            Ride.findById.mockResolvedValue(mockRideDoc());
            Driver.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            const res = await request(app).get('/ride1');
            expect(res.status).toBe(200);
            expect(res.body.ride.driver.isVerified).toBe(false);
        });

        it('includes fare estimate when pickup/drop query params are provided', async () => {
            Ride.findById.mockResolvedValue(mockRideDoc());
            Driver.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockDriverRecord()) });
            const res = await request(app).get(
                '/ride1?pickupLat=38.5&pickupLng=-120.2&dropLat=43.252&dropLng=-126.453'
            );
            expect(res.status).toBe(200);
            expect(res.body.estimate).not.toBeNull();
            expect(res.body.estimate).toHaveProperty('distanceKm');
            expect(res.body.estimate).toHaveProperty('fare');
        });

        it('returns null estimate when query params are not provided', async () => {
            Ride.findById.mockResolvedValue(mockRideDoc());
            Driver.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockDriverRecord()) });
            const res = await request(app).get('/ride1');
            expect(res.status).toBe(200);
            expect(res.body.estimate).toBeNull();
        });
    });
});
