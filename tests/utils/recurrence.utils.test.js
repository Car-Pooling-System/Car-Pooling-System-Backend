import { generateRideDates } from '../../utils/recurrence.utils.js';

const makeSchedule = (departureTime, type, endDate, daysOfWeek = []) => ({
    departureTime,
    recurrence: {
        type,
        endDate: new Date(endDate),
        daysOfWeek,
    },
});

describe('recurrence.utils - generateRideDates', () => {
    describe('daily recurrence', () => {
        it('generates one date per day between start and end (inclusive)', () => {
            const schedule = makeSchedule(
                '2026-03-01T08:00:00',
                'daily',
                '2026-03-05T08:00:00'
            );
            const dates = generateRideDates(schedule);
            expect(dates).toHaveLength(5);
        });

        it('generates exactly one date when start equals end', () => {
            const schedule = makeSchedule(
                '2026-03-01T08:00:00',
                'daily',
                '2026-03-01T08:00:00'
            );
            const dates = generateRideDates(schedule);
            expect(dates).toHaveLength(1);
        });

        it('returns empty array when start is after end', () => {
            const schedule = makeSchedule(
                '2026-03-10T08:00:00',
                'daily',
                '2026-03-05T08:00:00'
            );
            const dates = generateRideDates(schedule);
            expect(dates).toHaveLength(0);
        });

        it('returns Date objects', () => {
            const schedule = makeSchedule(
                '2026-03-01T08:00:00',
                'daily',
                '2026-03-02T08:00:00'
            );
            const dates = generateRideDates(schedule);
            dates.forEach((d) => expect(d).toBeInstanceOf(Date));
        });
    });

    describe('weekly recurrence', () => {
        it('only includes dates for the specified days of week', () => {
            // Monday=1, Wednesday=3
            // 2026-03-02 is Monday, 2026-03-08 is Sunday
            const schedule = makeSchedule(
                '2026-03-02T08:00:00', // Monday
                'weekly',
                '2026-03-08T08:00:00', // Sunday
                [1, 3] // Monday, Wednesday
            );
            const dates = generateRideDates(schedule);
            // Mon Mar 2 (1) + Wed Mar 4 (3) = 2 dates
            expect(dates).toHaveLength(2);
            dates.forEach((d) => {
                expect([1, 3]).toContain(d.getDay());
            });
        });

        it('returns empty array when no days match', () => {
            // 2026-03-02 Mon to 2026-03-06 Fri, only Saturday(6) requested
            const schedule = makeSchedule(
                '2026-03-02T08:00:00',
                'weekly',
                '2026-03-06T08:00:00',
                [6]
            );
            const dates = generateRideDates(schedule);
            expect(dates).toHaveLength(0);
        });

        it('returns empty array when daysOfWeek is empty', () => {
            const schedule = makeSchedule(
                '2026-03-02T08:00:00',
                'weekly',
                '2026-03-08T08:00:00',
                []
            );
            const dates = generateRideDates(schedule);
            expect(dates).toHaveLength(0);
        });
    });
});
