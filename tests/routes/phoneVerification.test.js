import request from 'supertest';
import express from 'express';

// Mock twilio before importing the router
jest.mock('twilio', () => {
    return jest.fn().mockReturnValue({
        verify: {
            v2: {
                services: jest.fn().mockReturnValue({
                    verifications: {
                        create: jest.fn().mockResolvedValue({ status: 'pending' }),
                    },
                    verificationChecks: {
                        create: jest.fn().mockResolvedValue({ status: 'approved' }),
                    },
                }),
            },
        },
    });
});

// Force mock Twilio config (env vars not set => mock mode)
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_VERIFY_SID;

import phoneVerificationRouter from '../../routes/phoneVerification.router.js';

const app = express();
app.use(express.json());
app.use('/', phoneVerificationRouter);

describe('Phone Verification Routes (Mock mode)', () => {
    describe('POST /send-otp', () => {
        it('returns 400 when phoneNumber is missing', async () => {
            const res = await request(app).post('/send-otp').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Phone number is required');
        });

        it('returns mock OTP response when Twilio is not configured', async () => {
            const res = await request(app)
                .post('/send-otp')
                .send({ phoneNumber: '+923001234567' });
            expect(res.status).toBe(200);
            expect(res.body.mock).toBe(true);
            expect(res.body.status).toBe('pending');
        });
    });

    describe('POST /verify-otp', () => {
        it('returns 400 when phoneNumber is missing', async () => {
            const res = await request(app).post('/verify-otp').send({ code: '123456' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Phone number and code are required');
        });

        it('returns 400 when code is missing', async () => {
            const res = await request(app)
                .post('/verify-otp')
                .send({ phoneNumber: '+923001234567' });
            expect(res.status).toBe(400);
        });

        it('verifies successfully with correct mock OTP 123456', async () => {
            const res = await request(app)
                .post('/verify-otp')
                .send({ phoneNumber: '+923001234567', code: '123456' });
            expect(res.status).toBe(200);
            expect(res.body.verified).toBe(true);
        });

        it('returns 400 with wrong OTP in mock mode', async () => {
            const res = await request(app)
                .post('/verify-otp')
                .send({ phoneNumber: '+923001234567', code: '999999' });
            expect(res.status).toBe(400);
            expect(res.body.verified).toBe(false);
        });
    });
});
