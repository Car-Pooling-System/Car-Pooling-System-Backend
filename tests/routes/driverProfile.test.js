import request from 'supertest';
import express from 'express';

jest.mock('../../models/driver.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));

import Driver from '../../models/driver.model.js';
import driverProfileRouter from '../../routes/driver/driverProfile.router.js';

const app = express();
app.use(express.json());
app.use('/', driverProfileRouter);

const mockDriver = (overrides = {}) => ({
    userId: 'user1',
    profileImage: 'img.jpg',
    phoneNumber: '0300000000',
    vehicle: { brand: 'Toyota' },
    documents: { drivingLicense: 'url' },
    verification: {
        vehicleVerified: true,
        drivingLicenseVerified: true,
        phoneVerified: true,
    },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Driver Profile Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /:userId', () => {
        it('returns driver data when found', async () => {
            Driver.findOne.mockResolvedValue(mockDriver());
            const res = await request(app).get('/user1');
            expect(res.status).toBe(200);
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:userId', () => {
        it('resets phoneVerified false when phone number changes', async () => {
            const d = mockDriver({ phoneNumber: 'OLD', verification: { phoneVerified: true, vehicleVerified: true, drivingLicenseVerified: true } });
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1')
                .send({ phoneNumber: 'NEW' });
            expect(res.status).toBe(200);
            expect(d.verification.phoneVerified).toBe(false);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).put('/unknown').send({ phoneNumber: 'NEW' });
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:userId/phone', () => {
        it('returns 400 when phoneNumber is missing', async () => {
            const res = await request(app).put('/user1/phone').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Phone number is required');
        });

        it('updates phone and sets phoneVerified to true', async () => {
            const d = mockDriver({ verification: { phoneVerified: false } });
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1/phone')
                .send({ phoneNumber: '+923001234567' });
            expect(res.status).toBe(200);
            expect(d.phoneNumber).toBe('+923001234567');
            expect(d.verification.phoneVerified).toBe(true);
            expect(d.save).toHaveBeenCalled();
        });

        it('returns 404 when driver not found', async () => {
            Driver.findOne.mockResolvedValue(null);
            const res = await request(app).put('/unknown/phone').send({ phoneNumber: '123' });
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:userId/image', () => {
        it('returns 400 when profileImage is missing', async () => {
            const res = await request(app).put('/user1/image').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('profileImage is required');
        });

        it('updates profile image', async () => {
            const d = mockDriver();
            Driver.findOne.mockResolvedValue(d);
            const res = await request(app)
                .put('/user1/image')
                .send({ profileImage: 'new-img.jpg' });
            expect(res.status).toBe(200);
            expect(d.profileImage).toBe('new-img.jpg');
            expect(d.save).toHaveBeenCalled();
        });
    });

    describe('DELETE /:userId', () => {
        it('deletes driver and returns 200', async () => {
            Driver.findOneAndDelete.mockResolvedValue({ userId: 'user1' });
            const res = await request(app).delete('/user1');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Driver profile deleted successfully');
        });

        it('returns 404 when driver not found for delete', async () => {
            Driver.findOneAndDelete.mockResolvedValue(null);
            const res = await request(app).delete('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
