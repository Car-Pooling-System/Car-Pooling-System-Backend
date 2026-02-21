import { decodePolyline } from '../../utils/polyline.utils.js';

describe('polyline.utils - decodePolyline', () => {
    it('returns empty array for empty string', () => {
        expect(decodePolyline('')).toEqual([]);
    });

    it('returns empty array for null/undefined', () => {
        expect(decodePolyline(null)).toEqual([]);
        expect(decodePolyline(undefined)).toEqual([]);
    });

    it('decodes a known Google Polyline encoded string correctly', () => {
        // Encoded polyline for: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = decodePolyline(encoded);

        expect(result).toHaveLength(3);

        // result is [lng, lat] pairs
        const [lng0, lat0] = result[0];
        const [lng1, lat1] = result[1];
        const [lng2, lat2] = result[2];

        expect(lat0).toBeCloseTo(38.5, 4);
        expect(lng0).toBeCloseTo(-120.2, 4);

        expect(lat1).toBeCloseTo(40.7, 4);
        expect(lng1).toBeCloseTo(-120.95, 4);

        expect(lat2).toBeCloseTo(43.252, 4);
        expect(lng2).toBeCloseTo(-126.453, 4);
    });

    it('returns an array of [lng, lat] pairs', () => {
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = decodePolyline(encoded);
        result.forEach((point) => {
            expect(Array.isArray(point)).toBe(true);
            expect(point).toHaveLength(2);
        });
    });
});
