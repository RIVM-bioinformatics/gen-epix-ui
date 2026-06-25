import {
  describe,
  expect,
  it,
} from 'vitest';

import type { FindSimilarCasesChartDataPoint } from '../../models/epi';

import { EpiFindSimilarCasesUtil } from './EpiFindSimilarCasesUtil';

const pt = (date: string, count: number): FindSimilarCasesChartDataPoint => ({ count, date });

describe('EpiFindSimilarCasesUtil', () => {
  describe('buildChartIntervals', () => {

    it('returns empty array for empty data', () => {
      expect(EpiFindSimilarCasesUtil.buildChartIntervals([])).toEqual([]);
    });

    describe('day granularity', () => {
      it('produces a single interval for a single data point', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([pt('2024-01-15', 3)]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          count: 3,
          endDate: '2024-01-15',
          label: '2024-01-15',
          startDate: '2024-01-15',
        });
      });

      it('creates an interval entry for every day between first and last data point, filling gaps with count 0', () => {
        // 2024-01-01 to 2024-01-04 → 4 days (3-day span, ≤ 90)
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2024-01-04', 2),
        ]);

        expect(result).toHaveLength(4);
        expect(result[0]).toMatchObject({ count: 1, label: '2024-01-01' });
        expect(result[1]).toMatchObject({ count: 0, label: '2024-01-02' });
        expect(result[2]).toMatchObject({ count: 0, label: '2024-01-03' });
        expect(result[3]).toMatchObject({ count: 2, label: '2024-01-04' });
      });

      it('startDate and endDate equal the calendar day (yyyy-MM-dd)', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([pt('2024-03-15', 5)]);

        expect(result[0].startDate).toBe('2024-03-15');
        expect(result[0].endDate).toBe('2024-03-15');
      });

      it('sums counts when multiple data points share the same day', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 2),
          pt('2024-01-01', 3),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(5);
      });

      it('sums counts on the same day even when interspersed with other days', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2024-01-01', 4),
          pt('2024-01-03', 2),
        ]);

        expect(result).toHaveLength(3);
        expect(result[0].count).toBe(5);
        expect(result[1].count).toBe(0); // gap
        expect(result[2].count).toBe(2);
      });

      it('uses day granularity for exactly 90-day span (boundary)', () => {
        // 2024 is a leap year. differenceInDays(2024-03-31, 2024-01-01) = 90.
        // Jan: 31 days remaining after Jan 1 = 30, Feb: 29, Mar: 31 → 30+29+31 = 90.
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2024-03-31', 1),
        ]);

        // 91 inclusive days
        expect(result).toHaveLength(91);
        expect(result[0].label).toBe('2024-01-01');
        expect(result[90].label).toBe('2024-03-31');
        // Labels match yyyy-MM-dd format
        expect(result[0].label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('handles data points all with count 0', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-05-01', 0),
          pt('2024-05-02', 0),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].count).toBe(0);
        expect(result[1].count).toBe(0);
      });
    });

    describe('month granularity', () => {
      it('creates a monthly interval for every calendar month between first and last data point', () => {
        // 2024-01-15 to 2024-10-01: differenceInDays ≈ 260 (91–730 → month)
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-15', 5),
          pt('2024-10-01', 3),
        ]);

        // Jan 2024 … Oct 2024 = 10 months
        expect(result).toHaveLength(10);
        expect(result[0].label).toBe('2024-01');
        expect(result[9].label).toBe('2024-10');
      });

      it('label format is yyyy-MM', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2024-06-30', 1),
        ]);

        for (const interval of result) {
          expect(interval.label).toMatch(/^\d{4}-\d{2}$/);
        }
      });

      it('startDate is the first day of the month and endDate is the last day', () => {
        // Use February in a leap year (2024) to test month-end correctly
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-15', 1),
          pt('2024-06-01', 1),
        ]);

        const jan = result[0];
        expect(jan.label).toBe('2024-01');
        expect(jan.startDate).toBe('2024-01-01');
        expect(jan.endDate).toBe('2024-01-31');

        const feb = result[1];
        expect(feb.label).toBe('2024-02');
        expect(feb.startDate).toBe('2024-02-01');
        expect(feb.endDate).toBe('2024-02-29'); // 2024 is leap year

        const jun = result[result.length - 1];
        expect(jun.startDate).toBe('2024-06-01');
        expect(jun.endDate).toBe('2024-06-30');
      });

      it('fills gap months with count 0', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-10', 5),
          pt('2024-10-20', 3),
        ]);

        expect(result[0].count).toBe(5); // Jan
        for (let i = 1; i < result.length - 1; i++) {
          expect(result[i].count).toBe(0); // Feb-Sep
        }
        expect(result[result.length - 1].count).toBe(3); // Oct
      });

      it('sums counts for multiple data points within the same month', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-05', 2),
          pt('2024-01-20', 4),
          pt('2024-10-01', 1),
        ]);

        expect(result[0].label).toBe('2024-01');
        expect(result[0].count).toBe(6); // 2 + 4
      });

      it('groups data points in the same month even from different ISO dates', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-03-01', 10),
          pt('2024-03-15', 5),
          pt('2024-03-31', 3),
          pt('2024-12-01', 1),
        ]);

        const marchIndex = result.findIndex(r => r.label === '2024-03');
        expect(marchIndex).toBeGreaterThanOrEqual(0);
        expect(result[marchIndex].count).toBe(18); // 10 + 5 + 3
      });

      it('uses month granularity for exactly 730-day span (boundary)', () => {
        // 2024-01-01 to 2025-12-31:
        // 2024 (leap, 366 days) + 364 days into 2025 = 730 days → month granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2025-12-31', 1),
        ]);

        // 24 months: Jan 2024 … Dec 2025
        expect(result).toHaveLength(24);
        expect(result[0].label).toBe('2024-01');
        expect(result[23].label).toBe('2025-12');
        expect(result[0].label).toMatch(/^\d{4}-\d{2}$/);
      });

      it('spans year boundary correctly', () => {
        // 2024-07-01 to 2025-03-01: ≈ 245 days → month granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-07-01', 7),
          pt('2025-03-01', 3),
        ]);

        // Jul, Aug, Sep, Oct, Nov, Dec 2024 (6) + Jan, Feb, Mar 2025 (3) = 9 months
        expect(result).toHaveLength(9);
        expect(result[0].label).toBe('2024-07');
        expect(result[8].label).toBe('2025-03');
      });
    });

    describe('quarter granularity', () => {
      it('creates a quarterly interval for every quarter between first and last data point', () => {
        // 2024-01-01 to 2026-01-01:
        // 2024 leap (366) + 2025 (365) = 731 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 7),
          pt('2026-01-01', 4),
        ]);

        // Q1 2024 … Q1 2026 = 9 quarters
        expect(result).toHaveLength(9);
        expect(result[0].label).toBe('2024-Q1');
        expect(result[8].label).toBe('2026-Q1');
      });

      it('label format is yyyy-QQQ', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2026-01-01', 1),
        ]);

        for (const interval of result) {
          expect(interval.label).toMatch(/^\d{4}-Q[1-4]$/);
        }
      });

      it('startDate is the first day of the quarter and endDate is the last day', () => {
        // 2024-01-01 to 2026-01-01 = 731 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2026-01-01', 1),
        ]);

        // Q1 2024: Jan 1 – Mar 31
        expect(result[0].label).toBe('2024-Q1');
        expect(result[0].startDate).toBe('2024-01-01');
        expect(result[0].endDate).toBe('2024-03-31');

        // Q2 2024: Apr 1 – Jun 30
        expect(result[1].label).toBe('2024-Q2');
        expect(result[1].startDate).toBe('2024-04-01');
        expect(result[1].endDate).toBe('2024-06-30');

        // Q3 2024: Jul 1 – Sep 30
        expect(result[2].label).toBe('2024-Q3');
        expect(result[2].startDate).toBe('2024-07-01');
        expect(result[2].endDate).toBe('2024-09-30');

        // Q4 2024: Oct 1 – Dec 31
        expect(result[3].label).toBe('2024-Q4');
        expect(result[3].startDate).toBe('2024-10-01');
        expect(result[3].endDate).toBe('2024-12-31');
      });

      it('fills gap quarters with count 0', () => {
        // 2024-01-01 to 2026-01-01 = 731 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 7),
          pt('2026-01-01', 4),
        ]);

        expect(result[0].count).toBe(7);
        for (let i = 1; i < result.length - 1; i++) {
          expect(result[i].count).toBe(0);
        }
        expect(result[result.length - 1].count).toBe(4);
      });

      it('sums counts for multiple data points within the same quarter', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-10', 3),
          pt('2024-02-20', 5),
          pt('2024-03-15', 2),
          pt('2026-01-10', 1),
        ]);

        expect(result[0].label).toBe('2024-Q1');
        expect(result[0].count).toBe(10); // 3 + 5 + 2
      });

      it('places data point in the correct quarter based on its date', () => {
        // 2024-04-01 to 2026-04-02 = 731 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-04-01', 6), // Q2
          pt('2026-04-02', 2),
        ]);

        expect(result[0].label).toBe('2024-Q2');
        expect(result[0].count).toBe(6);
      });

      it('uses quarter granularity for exactly 731-day span (boundary)', () => {
        // 2024-01-01 to 2026-01-01 = 366 + 365 = 731 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2026-01-01', 1),
        ]);

        expect(result[0].label).toMatch(/^\d{4}-Q[1-4]$/);
        expect(result).toHaveLength(9);
      });

      it('uses quarter granularity for exactly 2920-day span (upper boundary)', () => {
        // 2024-01-01 to 2031-12-30:
        // 366 + 365 + 365 + 365 + 366 + 365 + 365 + 363 = 2920 days → quarter granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2031-12-30', 1),
        ]);

        // Should be quarter format
        expect(result[0].label).toMatch(/^\d{4}-Q[1-4]$/);
      });
    });

    describe('year granularity', () => {
      it('creates a yearly interval for every year between first and last data point', () => {
        // 2024-01-01 to 2033-01-01: 9 years across leap cycle > 2920 days
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-03-15', 10),
          pt('2033-06-20', 5),
        ]);

        // Years 2024 … 2033 = 10 years
        expect(result).toHaveLength(10);
        expect(result[0].label).toBe('2024');
        expect(result[9].label).toBe('2033');
      });

      it('label format is yyyy', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2033-01-01', 1),
        ]);

        for (const interval of result) {
          expect(interval.label).toMatch(/^\d{4}$/);
        }
      });

      it('startDate is the first day of the year and endDate is the last day', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-06-01', 1),
          pt('2033-01-01', 1),
        ]);

        expect(result[0].label).toBe('2024');
        expect(result[0].startDate).toBe('2024-01-01');
        expect(result[0].endDate).toBe('2024-12-31');

        const lastYear = result[result.length - 1];
        expect(lastYear.startDate).toBe('2033-01-01');
        expect(lastYear.endDate).toBe('2033-12-31');
      });

      it('fills gap years with count 0', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2033-01-01', 1),
        ]);

        expect(result[0].count).toBe(1);
        for (let i = 1; i < result.length - 1; i++) {
          expect(result[i].count).toBe(0);
        }
        expect(result[result.length - 1].count).toBe(1);
      });

      it('sums counts for multiple data points within the same year', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-15', 3),
          pt('2024-06-30', 7),
          pt('2024-11-01', 2),
          pt('2033-06-20', 1),
        ]);

        expect(result[0].label).toBe('2024');
        expect(result[0].count).toBe(12); // 3 + 7 + 2
      });

      it('correctly attributes data points spread across different years', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-12-31', 4),
          pt('2025-01-01', 6),
          pt('2033-01-01', 1),
        ]);

        expect(result[0].label).toBe('2024');
        expect(result[0].count).toBe(4);
        expect(result[1].label).toBe('2025');
        expect(result[1].count).toBe(6);
      });

      it('uses year granularity for 2921-day span (just over the 2920 threshold)', () => {
        // 2024-01-01 to 2031-12-31:
        // 366 + 365 + 365 + 365 + 366 + 365 + 365 + 364 = 2921 days → year granularity
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2031-12-31', 1),
        ]);

        // Should be year format
        expect(result[0].label).toMatch(/^\d{4}$/);
        // Years 2024 … 2031 = 8 years
        expect(result).toHaveLength(8);
      });
    });

    describe('result structure invariants', () => {
      it('every interval has count >= 0', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 0),
          pt('2024-10-01', 0),
        ]);

        for (const interval of result) {
          expect(interval.count).toBeGreaterThanOrEqual(0);
        }
      });

      it('startDate comes before or equals endDate for all intervals', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2026-01-01', 1),
        ]);

        for (const interval of result) {
          expect(interval.startDate <= interval.endDate).toBe(true);
        }
      });

      it('intervals are ordered chronologically by label', () => {
        const result = EpiFindSimilarCasesUtil.buildChartIntervals([
          pt('2024-01-01', 1),
          pt('2024-10-01', 1),
        ]);

        for (let i = 1; i < result.length; i++) {
          expect(result[i].startDate > result[i - 1].startDate).toBe(true);
        }
      });

      it('total count across all intervals equals sum of input counts', () => {
        const data: FindSimilarCasesChartDataPoint[] = [
          pt('2024-01-05', 2),
          pt('2024-03-10', 7),
          pt('2024-07-20', 3),
        ];
        const inputTotal = data.reduce((sum, d) => sum + d.count, 0);
        const result = EpiFindSimilarCasesUtil.buildChartIntervals(data);
        const outputTotal = result.reduce((sum, r) => sum + r.count, 0);

        expect(outputTotal).toBe(inputTotal);
      });

      it('total count is preserved across month granularity', () => {
        const data: FindSimilarCasesChartDataPoint[] = [
          pt('2024-01-05', 4),
          pt('2024-01-20', 6),
          pt('2024-06-15', 3),
          pt('2024-09-01', 1),
        ];
        const inputTotal = data.reduce((sum, d) => sum + d.count, 0);
        const result = EpiFindSimilarCasesUtil.buildChartIntervals(data);
        const outputTotal = result.reduce((sum, r) => sum + r.count, 0);

        expect(outputTotal).toBe(inputTotal);
      });

      it('total count is preserved across quarter granularity', () => {
        const data: FindSimilarCasesChartDataPoint[] = [
          pt('2024-01-05', 10),
          pt('2024-04-20', 5),
          pt('2026-01-01', 2),
        ];
        const inputTotal = data.reduce((sum, d) => sum + d.count, 0);
        const result = EpiFindSimilarCasesUtil.buildChartIntervals(data);
        const outputTotal = result.reduce((sum, r) => sum + r.count, 0);

        expect(outputTotal).toBe(inputTotal);
      });

      it('total count is preserved across year granularity', () => {
        const data: FindSimilarCasesChartDataPoint[] = [
          pt('2024-03-01', 8),
          pt('2025-07-15', 4),
          pt('2033-11-30', 9),
        ];
        const inputTotal = data.reduce((sum, d) => sum + d.count, 0);
        const result = EpiFindSimilarCasesUtil.buildChartIntervals(data);
        const outputTotal = result.reduce((sum, r) => sum + r.count, 0);

        expect(outputTotal).toBe(inputTotal);
      });
    });
  });
});
