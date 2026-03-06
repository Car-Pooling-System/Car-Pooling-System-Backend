import request from 'supertest';
import app from '../../server.js';
import Ride from '../../models/ride.model.js';
import Driver from '../../models/driver.model.js';
import User from '../../models/user.model.js';
import { createMockQuery } from './test.setup.js';

// Mock the models
jest.mock('../../models/ride.model.js');
jest.mock('../../models/driver.model.js');
jest.mock('../../models/user.model.js', () => {
    return {
        __esModule: true,
        default: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            updateOne: jest.fn(),
        }
    };
});

// Mock utilities
jest.mock('../../utils/mailer.utils.js', () => ({
    sendBookingConfirmation: jest.fn(),
}));

// Mock polyline to return distinct points
jest.mock('../../utils/polyline.utils.js', () => ({
    decodePolyline: jest.fn().mockReturnValue([[67.01, 24.86], [67.02, 24.87], [67.05, 24.90]])
}));

describe('Ride Lifecycle Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Restore default mock for polyline in case it was changed
        import('../../utils/polyline.utils.js').then(m => {
            m.decodePolyline.mockReturnValue([[67.01, 24.86], [67.02, 24.87], [67.05, 24.90]]);
        });
    });

    it('should complete a full ride lifecycle flow (Creation -> Search -> Booking)', async () => {
        const mockDepartureTime = new Date(Date.now() + 86400000).toISOString();
        const validRideData = {
            driver: { userId: 'driver1', name: 'John Driver' },
            vehicle: { brand: 'Toyota', model: 'Corolla', year: 2022, color: 'Silver' },
            route: {
                start: { lat: 24.86, lng: 67.01, name: 'Saddar' },
                end: { lat: 24.90, lng: 67.05, name: 'Gulshan' },
                encodedPolyline: '_p~iF~ps|U_p~iF~ps|V', // dummy string, mocked anyway
                gridsCovered: ['497_1340'],
            },
            schedule: { departureTime: mockDepartureTime },
            pricing: { baseFare: 200 },
            seats: { available: 3 },
            metrics: { totalDistanceKm: 10, durationMinutes: 30 },
            passengers: []
        };

        // 1. Create a Ride
        Ride.find.mockReturnValue(createMockQuery([]));
        Ride.create.mockResolvedValue({ _id: 'ride123', ...validRideData });
        Driver.updateOne.mockResolvedValue({ nModified: 1 });

        const createRes = await request(app)
            .post('/api/rides')
            .send(validRideData);

        expect(createRes.status).toBe(201);
        expect(createRes.body._id).toBe('ride123');

        // 2. Search for the Ride
        const searchParams = {
            pickupLat: 24.86,
            pickupLng: 67.01,
            dropLat: 24.90,
            dropLng: 67.05,
            passengers: 1,
        };

        Ride.find.mockReturnValue(createMockQuery([{
            _id: 'ride123',
            ...validRideData,
            toObject: () => ({ _id: 'ride123', ...validRideData })
        }]));

        const searchRes = await request(app)
            .get('/api/rides/search')
            .query(searchParams);

        expect(searchRes.status).toBe(200);

        // 3. Book the Ride
        const bookingData = {
            user: { userId: 'rider1', name: 'Alice Rider', email: 'alice@example.com' },
            pickup: { lat: 24.86, lng: 67.01 },
            drop: { lat: 24.90, lng: 67.05 }
        };

        const mockRideDoc = {
            _id: 'ride123',
            ...validRideData,
            passengers: [],
            save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
        };

        Ride.findById.mockReturnValue(createMockQuery(mockRideDoc));
        User.findOneAndUpdate.mockReturnValue(createMockQuery({ userId: 'rider1' }));

        const bookRes = await request(app)
            .post('/api/rides/ride123/book')
            .send(bookingData);

        expect(bookRes.status).toBe(200);
        expect(bookRes.body.message).toBe('Ride booked');
        expect(mockRideDoc.seats.available).toBe(2);
        expect(mockRideDoc.passengers.length).toBe(1);
    });
});
