import {
  describe,
  it,
  expect,
  vi,
} from 'vitest';

import { OutageUtil } from './OutageUtil';

describe('OutageUtil', () => {
  describe('filterOutages', () => {
    beforeAll(() => {
      const date = new Date(2020, 5, 1, 10, 0, 0);
      vi.useFakeTimers();
      vi.setSystemTime(date);
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
          id: '3',
          is_active: false,
          is_visible: false,
          active_from: '2020-04-01T00:00:00Z',
        },
        {
          id: '4',
          is_active: false,
          is_visible: false,
          active_from: '2020-04-01T00:00:00Z',
          active_to: '2020-05-02T00:00:00Z',
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
          id: '8',
          is_active: false,
          is_visible: false,
          active_from: '2020-06-01T11:00:00Z',
        },
      ];

      const { visibleOutages, activeOutages, soonActiveOutages } = OutageUtil.getCategorizedOutages(outages);

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
  });
});
