import { latLngToGrid, GRID_SIZE } from '../../utils/geo.utils.js';

describe('geo.utils', () => {
    describe('GRID_SIZE', () => {
        it('should equal 0.02', () => {
            expect(GRID_SIZE).toBe(0.02);
        });
    });

    describe('latLngToGrid', () => {
        it('should return a grid key string in format "latIdx_lngIdx"', () => {
            const result = latLngToGrid(24.8607, 67.0101);
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^-?\d+_-?\d+$/);
        });

        it('should use default size of 0.05', () => {
            // lat=10.1, lng=20.2 => latIdx=floor(10.1/0.05)=202, lngIdx=floor(20.2/0.05)=404
            expect(latLngToGrid(10.1, 20.2)).toBe('202_404');
        });

        it('should respect custom size parameter', () => {
            // lat=10, lng=20 with size=1 => 10_20
            expect(latLngToGrid(10, 20, 1)).toBe('10_20');
        });

        it('should handle negative coordinates', () => {
            const result = latLngToGrid(-33.8688, 151.2093);
            expect(result).toMatch(/^-?\d+_-?\d+$/);
        });

        it('two points in the same grid cell should return the same key', () => {
            const g1 = latLngToGrid(10.0, 20.0, 1);
            const g2 = latLngToGrid(10.9, 20.9, 1);
            expect(g1).toBe(g2);
        });

        it('two points in different grid cells should return different keys', () => {
            const g1 = latLngToGrid(10.0, 20.0, 1);
            const g2 = latLngToGrid(11.0, 20.0, 1);
            expect(g1).not.toBe(g2);
        });
    });
});
