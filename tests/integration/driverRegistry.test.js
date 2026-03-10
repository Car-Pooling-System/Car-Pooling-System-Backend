import request from 'supertest';
import app from '../../server.js';
import Driver from '../../models/driver.model.js';
import Rider from '../../models/user.model.js';
import { createMockQuery } from './test.setup.js';

// Mock the models
jest.mock('../../models/driver.model.js');
jest.mock('../../models/user.model.js');

describe('Driver Registry Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should complete driver registration, doc upload, and verification', async () => {
        const userId = 'driver123';

        // 1. Register Driver
        Driver.findOne.mockReturnValue(createMockQuery(null));
        Driver.create.mockResolvedValue({
            userId,
            verification: { emailVerified: false, phoneVerified: false }
        });

        const regRes = await request(app)
            .post(`/api/driver-register/${userId}`)
            .send({});

        expect(regRes.status).toBe(201);
        expect(regRes.body.message).toBe('Driver registered successfully');

        // 2. Upload Documents
        const mockDriverDoc = {
            userId,
            documents: {},
            verification: { emailVerified: false, phoneVerified: false, drivingLicenseVerified: false },
            save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
        };
        Driver.findOne.mockReturnValue(createMockQuery(mockDriverDoc));

        const docRes = await request(app)
            .put(`/api/driver-docs/${userId}`)
            .send({ drivingLicense: 'DL123456' });

        expect(docRes.status).toBe(200);
        expect(mockDriverDoc.documents.drivingLicense).toBe('DL123456');

        // 3. Verify Driver (System Action - updates verification)
        Rider.findOneAndUpdate.mockReturnValue(createMockQuery({ userId }));

        const verifyRes = await request(app)
            .put(`/api/driver-verification/${userId}`)
            .send({ drivingLicenseVerified: true, aadharVerified: true, aadharNumber: '123412341234' });

        expect(verifyRes.status).toBe(200);
        expect(mockDriverDoc.verification.drivingLicenseVerified).toBe(true);
        expect(Rider.findOneAndUpdate).toHaveBeenCalled();

        // 4. Check Verification Status
        const statusRes = await request(app)
            .get(`/api/driver-verification/${userId}`);

        expect(statusRes.status).toBe(200);
        expect(statusRes.body.drivingLicenseVerified).toBe(true);
    });
});
