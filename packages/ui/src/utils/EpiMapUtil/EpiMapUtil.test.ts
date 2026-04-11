import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import type { Config } from '../../models/config';

import type { RegionStatistics } from './EpiMapUtil';
import { EpiMapUtil } from './EpiMapUtil';

describe('EpiMapUtil', () => {
  describe('getGeoJsonAspectScale', () => {
    it('determines the aspect scale from geojson bounds', () => {
      const geoJson = JSON.stringify({
        bbox: [3, 50, 8, 54],
        features: [],
        type: 'FeatureCollection',
      });

      expect(EpiMapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('determines the aspect scale from geometry coordinates when bbox is missing', () => {
      const geoJson = JSON.stringify({
        features: [
          {
            geometry: {
              coordinates: [
                [
                  [4, 51],
                  [6, 51],
                  [6, 53],
                  [4, 53],
                  [4, 51],
                ],
              ],
              type: 'Polygon',
            },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      });

      expect(EpiMapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('falls back to 1 when geojson can not be parsed', () => {
      expect(EpiMapUtil.getGeoJsonAspectScale('not-json')).toBe(1);
    });
  });

  describe('getPieChartRadius', () => {
    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiMap: {
          MIN_PIE_CHART_RADIUS: 4,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('determines the pie chart radius', () => {
      const statisticsBase: RegionStatistics = {
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 200,
        statisticsPerRegion: {},
      };

      const testCases: Array<[[number, number, RegionStatistics], number]> = [
        // test where minNumCases === maxNumCases (result should be maxArea)
        [[1, 1487, { ...statisticsBase, maxNumCases: 1, minNumCases: 1 }], 21.76],
        // test where numCases === minNumCases (result should be minArea)
        [[1, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], ConfigManager.instance.config.epiMap.MIN_PIE_CHART_RADIUS],
        // test where numCases === maxNumCases (result should be maxArea
        [[9, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], 21.76],
        // test where numCases is some where in between minNumCases and maxNumCases (area should be proportional)
        [[6, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], 17.37],
      ];

      testCases.forEach(([input, expectedOutput]) => {
        expect(EpiMapUtil.getPieChartRadius(...input)).toEqual(expectedOutput);
      });
    });
  });
});
