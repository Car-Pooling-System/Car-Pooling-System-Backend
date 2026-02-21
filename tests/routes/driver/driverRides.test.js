import request from 'supertest';
import express from 'express';

jest.mock('../../../models/ride.model.js', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
}));

import Ride from '../../../models/ride.model.js';
import driverRidesRouter from '../../../routes/driver/driverRides.router.js';

const app = express();
app.use(express.json());
app.use('/', driverRidesRouter);

describe('Driver Rides Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:driverUserId', () => {
        it('fetches rides for a driver', async () => {
            const mockRides = [{ _id: 'ride1' }, { _id: 'ride2' }];
            Ride.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockRides),
            });
            const res = await request(app).get('/driver1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockRides);
        });

        it('returns 500 on failure', async () => {
            Ride.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB Error')),
            });
            const res = await request(app).get('/driver1');
            expect(res.status).toBe(500);
        });
    });

    describe('DELETE /:rideId', () => {
        it('deletes a ride successfully', async () => {
            Ride.findByIdAndDelete.mockResolvedValue({ _id: 'ride1' });
            const res = await request(app).delete('/ride1');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Ride deleted successfully');
        });

        it('returns 404 when ride not found', async () => {
            Ride.findByIdAndDelete.mockResolvedValue(null);
            const res = await request(app).delete('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
