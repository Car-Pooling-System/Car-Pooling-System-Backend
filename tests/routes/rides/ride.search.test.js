import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: { find: jest.fn() },
}));

import Ride from '../../../models/ride.model.js';
import rideSearchRouter from '../../../routes/rides/ride.search.router.js';

const app = express();
app.use(express.json());
app.use('/', rideSearchRouter);

const ENCODED = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'; // 3 decoded points

const mockRide = (overrides = {}) => ({
    _id: 'ride1',
    driver: { userId: 'driver1', name: 'John' },
    schedule: { departureTime: new Date().toISOString() },
    seats: { available: 2 },
    preferences: {},
    pricing: { baseFare: 300 },
    metrics: { totalDistanceKm: 15 },
    route: { encodedPolyline: ENCODED, gridsCovered: ['497_1340'] },
    ...overrides,
});

describe('Ride Search Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /', () => {
        it('returns 400 when query params are missing', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Missing coordinates');
        });

        it('returns 400 when any coordinate is missing', async () => {
            const res = await request(app).get('/?pickupLat=38.5&pickupLng=-120.2');
            expect(res.status).toBe(400);
        });

        it('returns empty array when no rides found in DB', async () => {
            Ride.find.mockResolvedValue([]);
            const res = await request(app).get(
                '/?pickupLat=38.5&pickupLng=-120.2&dropLat=43.252&dropLng=-126.453'
            );
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('returns ride results with fare estimate for matching rides', async () => {
            Ride.find.mockResolvedValue([mockRide()]);
            const res = await request(app).get(
                '/?pickupLat=38.5&pickupLng=-120.2&dropLat=43.252&dropLng=-126.453'
            );
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('estimate');
            expect(res.body[0].estimate).toHaveProperty('fare');
        });

        it('skips rides with missing encodedPolyline', async () => {
            Ride.find.mockResolvedValue([mockRide({ route: { encodedPolyline: null, gridsCovered: [] } })]);
            const res = await request(app).get(
                '/?pickupLat=38.5&pickupLng=-120.2&dropLat=43.252&dropLng=-126.453'
            );
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('skips rides where pickup >= drop on route', async () => {
            // Swap pickup/drop so they map to wrong order on the polyline
            Ride.find.mockResolvedValue([mockRide()]);
            const res = await request(app).get(
                '/?pickupLat=43.252&pickupLng=-126.453&dropLat=38.5&dropLng=-120.2'
            );
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
});
