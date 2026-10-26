import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { DependencyContainerUtil } from '../DependencyContainerUtil';
import type { ConfigBase } from '../../models/config.models';

import { OutageUtil } from './OutageUtil';

const NOW = new Date('2020-06-01T10:00:00.000Z');

const addHoursToNow = (hours: number): string => {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString();
};

describe('OutageUtil', () => {
  describe('filterOutages', () => {
    beforeAll(() => {
      DependencyContainerUtil.registerConfig({
        outages: {
          NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: 8,
        },
      } as ConfigBase);
    });
    DependencyContainerUtil.initializeContainer();
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });
    afterAll(() => {
      vi.restoreAllMocks();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it('should split outages into visibleOutages, activeOutages, and soonActiveOutages', () => {

      // Sample data
      const outages = [
        {
          id: '1',
          is_active: false,
          is_visible: false,
        },

        // Test active
        {
          id: '2',
          is_active: true,
          is_visible: false,
        },
        {
          active_from: '2020-04-01T00:00:00Z',
          id: '3',
          is_active: false,
          is_visible: false,
        },
        {
          active_from: '2020-04-01T00:00:00Z',
          active_to: '2020-05-02T00:00:00Z',
          id: '4',
          is_active: false,
          is_visible: false,
        },

        // Test visible
        {
          id: '5',
          is_active: false,
          is_visible: true,
        },
        {
          id: '6',
          is_active: false,
          is_visible: false,
          visible_from: '2020-04-01T00:00:00Z',
        },
        {
          id: '7',
          is_active: false,
          is_visible: false,
          visible_from: '2020-04-01T00:00:00Z',
          visible_to: '2020-05-02T00:00:00Z',
        },

        // Test soon active
        {
          active_from: '2020-06-01T11:00:00Z',
          id: '8',
          is_active: false,
          is_visible: false,
        },
      ];

      const { activeOutages, soonActiveOutages, visibleOutages } = OutageUtil.getCategorizedOutages(outages);

      // Assertions
      expect(visibleOutages).toHaveLength(2);
      expect(visibleOutages.map(x => x.id)).toContain('5');
      expect(visibleOutages.map(x => x.id)).toContain('6');

      expect(activeOutages).toHaveLength(2);
      expect(activeOutages.map(x => x.id)).toContain('2');
      expect(activeOutages.map(x => x.id)).toContain('3');

      expect(soonActiveOutages).toHaveLength(1);
      expect(soonActiveOutages[0].id).toBe('8');
    });

    it('handles inclusive starts, exclusive ends, one-sided ranges, and the soon-active horizon', () => {
      const outages: CommonDbOutage[] = [
        {
          active_from: NOW.toISOString(),
          active_to: addHoursToNow(1),
          id: 'active-start-now',
        },
        {
          active_from: addHoursToNow(-1),
          active_to: NOW.toISOString(),
          id: 'active-end-now',
        },
        {
          active_from: addHoursToNow(-1),
          id: 'active-from-only-past',
        },
        {
          active_from: addHoursToNow(1),
          id: 'active-from-only-soon',
        },
        {
          active_from: addHoursToNow(8),
          id: 'active-from-only-at-horizon',
        },
        {
          active_from: addHoursToNow(9),
          id: 'active-from-only-outside-horizon',
        },
        {
          active_to: addHoursToNow(1),
          id: 'active-to-only-future',
        },
        {
          active_to: NOW.toISOString(),
          id: 'active-to-only-now',
        },
        {
          active_to: addHoursToNow(-1),
          id: 'active-to-only-past',
        },
        {
          active_from: addHoursToNow(2),
          active_to: addHoursToNow(4),
          id: 'active-range-soon',
        },
        {
          active_from: addHoursToNow(8),
          active_to: addHoursToNow(10),
          id: 'active-range-at-horizon',
        },
        {
          active_from: addHoursToNow(9),
          active_to: addHoursToNow(10),
          id: 'active-range-outside-horizon',
        },
        {
          active_from: addHoursToNow(-2),
          active_to: addHoursToNow(-1),
          id: 'active-range-ended',
        },
        {
          active_from: 'invalid',
          active_to: 'invalid',
          id: 'invalid-active-range',
        },
        {
          active_from: addHoursToNow(5),
          id: 'active-flag-override',
          is_active: true,
          is_visible: true,
        },
        {
          id: 'visible-start-now',
          visible_from: NOW.toISOString(),
          visible_to: addHoursToNow(1),
        },
        {
          id: 'visible-end-now',
          visible_from: addHoursToNow(-1),
          visible_to: NOW.toISOString(),
        },
        {
          id: 'visible-from-only-past',
          visible_from: addHoursToNow(-1),
        },
        {
          id: 'visible-from-only-future',
          visible_from: addHoursToNow(1),
        },
        {
          id: 'visible-to-only-future',
          visible_to: addHoursToNow(1),
        },
        {
          id: 'visible-to-only-past',
          visible_to: addHoursToNow(-1),
        },
        {
          id: 'invalid-visible-range',
          visible_from: 'invalid',
          visible_to: 'invalid',
        },
        {
          id: 'visible-flag-override',
          is_visible: true,
          visible_from: addHoursToNow(5),
        },
        {
          id: 'no-flags-or-dates',
        },
      ];

      const { activeOutages, soonActiveOutages, visibleOutages } = OutageUtil.getCategorizedOutages(outages);

      expect(activeOutages.map(outage => outage.id)).toEqual([
        'active-start-now',
        'active-from-only-past',
        'active-to-only-future',
        'active-flag-override',
      ]);
      expect(visibleOutages.map(outage => outage.id)).toEqual([
        'visible-start-now',
        'visible-from-only-past',
        'visible-to-only-future',
        'visible-flag-override',
      ]);
      expect(soonActiveOutages.map(outage => outage.id)).toEqual([
        'active-from-only-soon',
        'active-from-only-at-horizon',
        'active-range-soon',
        'active-range-at-horizon',
      ]);
    });
  });
});
