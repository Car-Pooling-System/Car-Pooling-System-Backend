import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: { findById: jest.fn() },
}));

jest.mock('../../../models/user.model.js', () => ({
    __esModule: true,
    default: { findOneAndUpdate: jest.fn() },
}));

// Provide a minimal real encoded polyline for path decoding
import Ride from '../../../models/ride.model.js';
import Rider from '../../../models/user.model.js';
import rideBookRouter from '../../../routes/rides/ride.book.router.js';

const app = express();
app.use(express.json());
app.use('/', rideBookRouter);

// '_p~iF~ps|U_ulLnnqC_mqNvxq`@' decodes to 3 points
const ENCODED = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

const mockRide = (overrides = {}) => ({
    _id: 'ride1',
    driver: { userId: 'driver1' },
    passengers: [],
    seats: { available: 2 },
    route: { encodedPolyline: ENCODED },
    pricing: { baseFare: 300 },
    metrics: { totalDistanceKm: 15 },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Ride Book Route', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /:rideId/book', () => {
        it('returns 404 when ride not found', async () => {
            Ride.findById.mockResolvedValue(null);
            const res = await request(app)
                .post('/ride1/book')
                .send({ user: { userId: 'u1' }, pickup: { lat: 38.5, lng: -120.2 }, drop: { lat: 43.252, lng: -126.453 } });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Ride not found');
        });

        it('returns 400 when no seats available', async () => {
            Ride.findById.mockResolvedValue(mockRide({ seats: { available: 0 } }));
            const res = await request(app)
                .post('/ride1/book')
                .send({ user: { userId: 'u1' }, pickup: { lat: 38.5, lng: -120.2 }, drop: { lat: 43.252, lng: -126.453 } });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('No seats available');
        });

        it('returns 400 when user already booked', async () => {
            const ride = mockRide({
                passengers: [{ userId: 'u1', status: 'confirmed' }],
            });
            Ride.findById.mockResolvedValue(ride);
            const res = await request(app)
                .post('/ride1/book')
                .send({ user: { userId: 'u1' }, pickup: { lat: 38.5, lng: -120.2 }, drop: { lat: 43.252, lng: -126.453 } });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('You have already booked this ride');
        });

        it('returns 400 when pickup is after drop on route', async () => {
            // Swap pickup and drop so pickupIdx >= dropIdx
            Ride.findById.mockResolvedValue(mockRide());
            const res = await request(app)
                .post('/ride1/book')
                .send({
                    user: { userId: 'u1' },
                    pickup: { lat: 43.252, lng: -126.453 }, // last point
                    drop: { lat: 38.5, lng: -120.2 },         // first point
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Pickup must be before drop');
        });

        it('books ride successfully and returns farePaid', async () => {
            const ride = mockRide();
            Ride.findById.mockResolvedValue(ride);
            Rider.findOneAndUpdate.mockResolvedValue({ userId: 'u1' });
            const res = await request(app)
                .post('/ride1/book')
                .send({
                    user: { userId: 'u2', name: 'Alice', profileImage: '' },
                    pickup: { lat: 38.5, lng: -120.2 },
                    drop: { lat: 43.252, lng: -126.453 },
                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('farePaid');
            expect(ride.save).toHaveBeenCalled();
        });
    });
});
