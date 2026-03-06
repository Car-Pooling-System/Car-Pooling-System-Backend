import request from 'supertest';
import express from 'express';

jest.mock('../../models/carbonEmission.model.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

import Emission from '../../models/carbonEmission.model.js';
import carbonRouter from '../../routes/carbon.router.js';

const app = express();
app.use(express.json());
app.use('/', carbonRouter);

describe('Carbon Emission Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        it('calculates emissions correctly for valid data', async () => {
            Emission.findOne.mockResolvedValue({ emissionFactor: 120 }); // 120g/km

            const res = await request(app)
                .get('/')
                .send({
                    type: 'SUV',
                    distances: [10000, 20000, 30000], // in meters
                });

            expect(res.status).toBe(200);
            expect(res.body.body.totalEmission).toBe(7.2); // (120 * (10+20+30)) / 1000 = 7.2
            expect(res.body.body.emissionArr).toEqual([1.2, 2.4, 3.6]);
            expect(res.body.body.emissionCaused).toBe(3.6);
            expect(res.body.body.savedEmission).toBe(3.6); // 7.2 - 3.6
            expect(res.body.body.realEmission).toEqual([0.2, 0.8, 1.8]); // 1.2 * (10/60), 2.4 * (20/60), 3.6 * (30/60)
        });

        it('returns 300 when an error occurs', async () => {
            Emission.findOne.mockRejectedValue(new Error('DB Error'));

            const res = await request(app)
                .get('/')
                .send({ type: 'SUV', distances: [1000] });

            expect(res.status).toBe(300);
            expect(res.body.message).toBe('Server error');
            expect(res.body.error).toBe('DB Error');
        });

        it('returns 404 when Emission.findOne returns null', async () => {
            Emission.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get('/')
                .send({ type: 'SUV', distances: [1000] });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Emission factor for type not found');
        });

        it('returns 400 when distances array is empty', async () => {
            Emission.findOne.mockResolvedValue({ emissionFactor: 120 });

            const res = await request(app)
                .get('/')
                .send({ type: 'SUV', distances: [] });

            expect(res.status).toBe(400);
        });

        it('returns 400 when distances field is missing', async () => {
            const res = await request(app)
                .get('/')
                .send({ type: 'SUV' });

            expect(res.status).toBe(400);
        });
    });
});
