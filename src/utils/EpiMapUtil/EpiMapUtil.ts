import max from 'lodash/max';
import min from 'lodash/min';
import round from 'lodash/round';

import type {
  Case,
  Region,
} from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';

export type RegionStatistics = {
  statisticsPerRegion: Record<string, { rows: Case[]; region: Region; numCases: number }>;
  minNumCases: number;
  maxNumCases: number;
  numCases: number;
};

export class EpiMapUtil {
  public static getRegionStatistics(cases: Case[], columnId: string, regions: Region[]): RegionStatistics {
    if (!cases.length || !columnId || !regions?.length) {
      return {
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 0,
        statisticsPerRegion: {},
      };
    }

    let numCases = 0;
    const statisticsPerRegion: Record<string, {
      rows: Case[];
      region: Region;
      numCases: number;
    }> = {};
    cases.forEach(row => {
      const regionId = row.content[columnId];
      if (!regionId) {
        return;
      }
      if (!statisticsPerRegion[regionId]) {
        statisticsPerRegion[regionId] = {
          rows: [],
          region: regions.find(region => region.id === regionId),
          numCases: 0,
        };
      }
      statisticsPerRegion[regionId].rows.push(row);
      // when count is null, 1 should be assumed
      statisticsPerRegion[regionId].numCases += (row.count ?? 1);
      // when count is null, 1 should be assumed
      numCases += (row.count ?? 1);
    });
    const maxNumCases = max(Object.values(statisticsPerRegion).map(region => region.numCases));
    const minNumCases = min(Object.values(statisticsPerRegion).map(region => region.numCases));

    return {
      statisticsPerRegion,
      minNumCases,
      maxNumCases,
      numCases,
    };
  }

  public static getPieChartRadius(numCases: number, maxPieChartArea: number, statistics: RegionStatistics) {
    const { maxNumCases, minNumCases } = statistics;
    const { MIN_PIE_CHART_RADIUS } = ConfigManager.instance.config.epiMap;
    const MIN_PIE_CHART_AREA = MIN_PIE_CHART_RADIUS ** 2 * Math.PI;

    let area: number;

    if (maxNumCases > minNumCases) {
      const slope = Math.max(MIN_PIE_CHART_AREA, (maxPieChartArea - MIN_PIE_CHART_AREA)) / (maxNumCases - minNumCases);
      area = (slope * (numCases - minNumCases)) + MIN_PIE_CHART_AREA;
    } else {
      area = maxPieChartArea;
    }
    const radius = round(Math.sqrt(area / Math.PI), 2);
    return Math.max(MIN_PIE_CHART_RADIUS, radius);
  }
}
