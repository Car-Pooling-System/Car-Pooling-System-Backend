import request from 'supertest';
import express from 'express';

jest.mock('../../models/payment.model.js', () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
    },
}));

import Payment from '../../models/payment.model.js';
import paymentRouter from '../../routes/payment/payment.router.js';

const app = express();
app.use(express.json());
app.use('/', paymentRouter);

const mockPayment = (overrides = {}) => ({
    _id: 'pay1',
    rideId: 'ride1',
    passengerId: 'user1',
    driverId: 'driver1',
    amount: 500,
    paymentMethod: 'cash',
    status: 'pending',
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe('Payment Routes', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /', () => {
        it('returns 400 when a required field is missing', async () => {
            const res = await request(app)
                .post('/')
                .send({ rideId: 'r1', passengerId: 'u1', driverId: 'd1', amount: 100 });
            // paymentMethod is missing
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Missing required fields');
        });

        it('creates payment and returns 201', async () => {
            const payment = mockPayment();
            Payment.create.mockResolvedValue(payment);
            const res = await request(app).post('/').send({
                rideId: 'ride1',
                passengerId: 'user1',
                driverId: 'driver1',
                amount: 500,
                paymentMethod: 'cash',
            });
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Payment initiated');
        });

        it('returns 500 on DB error', async () => {
            Payment.create.mockRejectedValue(new Error('DB fail'));
            const res = await request(app).post('/').send({
                rideId: 'r1', passengerId: 'u1', driverId: 'd1', amount: 100, paymentMethod: 'card',
            });
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:paymentId/status', () => {
        it('returns 400 when status is missing', async () => {
            const res = await request(app).put('/pay1/status').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Status is required');
        });

        it('returns 404 when payment not found', async () => {
            Payment.findById.mockResolvedValue(null);
            const res = await request(app).put('/pay1/status').send({ status: 'completed' });
            expect(res.status).toBe(404);
        });

        it('updates payment status and returns 200', async () => {
            const payment = mockPayment();
            Payment.findById.mockResolvedValue(payment);
            const res = await request(app)
                .put('/pay1/status')
                .send({ status: 'completed', transactionId: 'txn123' });
            expect(res.status).toBe(200);
            expect(payment.status).toBe('completed');
            expect(payment.transactionId).toBe('txn123');
            expect(payment.save).toHaveBeenCalled();
        });
    });

    describe('GET /:paymentId', () => {
        it('returns payment when found', async () => {
            Payment.findById.mockResolvedValue(mockPayment());
            const res = await request(app).get('/pay1');
            expect(res.status).toBe(200);
        });

        it('returns 404 when payment not found', async () => {
            Payment.findById.mockResolvedValue(null);
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('GET /passenger/:passengerId', () => {
        it('returns list of payments for passenger', async () => {
            Payment.find.mockResolvedValue([mockPayment(), mockPayment()]);
            const res = await request(app).get('/passenger/user1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it('returns empty array when no payments', async () => {
            Payment.find.mockResolvedValue([]);
            const res = await request(app).get('/passenger/unknown');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
});
