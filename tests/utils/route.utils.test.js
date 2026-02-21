import { findClosestPointIndex } from '../../utils/route.utils.js';

describe('route.utils - findClosestPointIndex', () => {
    it('returns -1 for an empty path', () => {
        expect(findClosestPointIndex([], { lat: 10, lng: 20 })).toBe(-1);
    });

    it('returns 0 for a single-element path', () => {
        const path = [[20, 10]]; // [lng, lat]
        expect(findClosestPointIndex(path, { lat: 10, lng: 20 })).toBe(0);
    });

    it('returns the index of the closest point', () => {
        const path = [
            [0, 0],   // [lng, lat] => (lat=0, lng=0)
            [1, 0],   // (lat=0, lng=1)
            [5, 0],   // (lat=0, lng=5)
        ];
        // Point closest to lng=1, lat=0 should be index 1
        const idx = findClosestPointIndex(path, { lat: 0, lng: 1.1 });
        expect(idx).toBe(1);
    });

    it('returns the exact index when point matches a path coordinate', () => {
        const path = [
            [10, 20],
            [30, 40],
            [50, 60],
        ];
        // Point matching path[2] exactly (lng=50, lat=60)
        const idx = findClosestPointIndex(path, { lat: 60, lng: 50 });
        expect(idx).toBe(2);
    });

    it('handles large paths and returns a valid index', () => {
        const path = Array.from({ length: 100 }, (_, i) => [i, i]);
        const idx = findClosestPointIndex(path, { lat: 45, lng: 45 });
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(100);
    });
});
