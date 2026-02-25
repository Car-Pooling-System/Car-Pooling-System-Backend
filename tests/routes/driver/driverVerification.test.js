import request from 'supertest';
import express from 'express';

jest.mock('../../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Driver from '../../../models/driver.model.js';
import driverVerificationRouter from '../../../routes/driver/driverVerification.router.js';

const app = express();
app.use(express.json());
app.use('/', driverVerificationRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    verification: {
        emailVerified: true,
        phoneVerified: false,
        drivingLicenseVerified: false,
        vehicleVerified: false,
    },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Verification Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns verification status when found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockDriver()),
            });
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
            expect(res.body.emailVerified).toBe(true);
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:userId', () => {
        it('updates verification flags successfully', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1')
                .send({ phoneVerified: true, vehicleVerified: true });
            expect(res.status).toBe(200);
            expect(d.verification.phoneVerified).toBe(true);
            expect(d.verification.vehicleVerified).toBe(true);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 400 for invalid fields', async () => {
            const res = await request(app)
                .put('/user1')
                .send({ invalidField: true });
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /:userId', () => {
        it('resets verification flags', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app).delete('/user1');
            expect(res.status).toBe(200);
            expect(d.verification.emailVerified).toBe(false);
            expect(d.save).toHaveBeenCalled();
        });
    });
});
