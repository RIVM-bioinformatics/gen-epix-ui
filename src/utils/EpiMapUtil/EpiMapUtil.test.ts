import { ConfigManager } from '../../classes/managers/ConfigManager';

import type { RegionStatistics } from './EpiMapUtil';
import { EpiMapUtil } from './EpiMapUtil';

describe('EpiMapUtil', () => {
  describe('getPieChartRadius', () => {
    it('determines the pie chart radius', () => {
      const statisticsBase: RegionStatistics = {
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 200,
        statisticsPerRegion: {},
      };

      const testCases: Array<[[number, number, RegionStatistics], number]> = [
        // test where minNumCases === maxNumCases (result should be maxArea)
        [[1, 1487, { ...statisticsBase, minNumCases: 1, maxNumCases: 1 }], 21.76],
        // test where numCases === minNumCases (result should be minArea)
        [[1, 1487, { ...statisticsBase, minNumCases: 1, maxNumCases: 9 }], ConfigManager.instance.config.epiMap.MIN_PIE_CHART_RADIUS],
        // test where numCases === maxNumCases (result should be maxArea
        [[9, 1487, { ...statisticsBase, minNumCases: 1, maxNumCases: 9 }], 21.76],
        // test where numCases is some where in between minNumCases and maxNumCases (area should be proportional)
        [[6, 1487, { ...statisticsBase, minNumCases: 1, maxNumCases: 9 }], 17.37],
      ];

      testCases.forEach(([input, expectedOutput]) => {
        expect(EpiMapUtil.getPieChartRadius(...input)).toEqual(expectedOutput);
      });
    });
  });
});
