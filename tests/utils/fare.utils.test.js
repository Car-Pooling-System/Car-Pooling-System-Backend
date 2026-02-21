// Mock haversine-distance before importing fare.utils
jest.mock('haversine-distance', () => jest.fn(() => 1000)); // always 1000 meters

import { calculateSegmentDistance } from '../../utils/fare.utils.js';
import haversine from 'haversine-distance';

describe('fare.utils - calculateSegmentDistance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        haversine.mockReturnValue(1000); // 1000m per segment
    });

    it('returns 0 when pickupIdx equals dropIdx', () => {
        const path = [[0, 0], [1, 1], [2, 2]];
        const dist = calculateSegmentDistance(path, 1, 1);
        expect(dist).toBe(0);
        expect(haversine).not.toHaveBeenCalled();
    });

    it('calculates distance between two adjacent points (1 haversine call)', () => {
        const path = [[0, 0], [1, 1], [2, 2]];
        // pickupIdx=0, dropIdx=1 => 1 segment => haversine called once with 1000m
        const dist = calculateSegmentDistance(path, 0, 1);
        expect(haversine).toHaveBeenCalledTimes(1);
        expect(dist).toBeCloseTo(1); // 1000m / 1000 = 1 km
    });

    it('sums haversine calls for multiple segments', () => {
        haversine.mockReturnValue(500); // 500m per segment
        const path = [[0, 0], [1, 1], [2, 2], [3, 3]];
        // pickupIdx=0, dropIdx=3 => 3 segments => 3 * 500 = 1500m = 1.5km
        const dist = calculateSegmentDistance(path, 0, 3);
        expect(haversine).toHaveBeenCalledTimes(3);
        expect(dist).toBeCloseTo(1.5);
    });

    it('returns distance in km (divides meters by 1000)', () => {
        haversine.mockReturnValue(2500);
        const path = [[0, 0], [1, 1]];
        const dist = calculateSegmentDistance(path, 0, 1);
        expect(dist).toBeCloseTo(2.5);
    });

    it('passes correct lat/lng to haversine', () => {
        // path is [lng, lat] pairs
        const path = [[10, 20], [30, 40]]; // [lng,lat]
        calculateSegmentDistance(path, 0, 1);
        expect(haversine).toHaveBeenCalledWith(
            { lat: 20, lng: 10 },
            { lat: 40, lng: 30 }
        );
    });
});
