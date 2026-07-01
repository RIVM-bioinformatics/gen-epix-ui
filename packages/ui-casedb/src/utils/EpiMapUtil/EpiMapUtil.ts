import max from 'lodash/max';
import min from 'lodash/min';
import round from 'lodash/round';
import type { PieSeriesOption } from 'echarts';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbRegion,
} from '@gen-epix/api-casedb';
import { ConfigManager } from '@gen-epix/ui';
import type { UnwrapArray } from '@gen-epix/ui';

import type { CaseDbConfig } from '../../models/config';
import type { Stratification } from '../../models/epi';
import { DashboardUtil } from '../DashboardUtil';


export type GenEpixPieSeriesOptionEventData = {
  genEpixData?: {
    caseIds: string[];
    regionId: string;
  };
};

export type RegionStatistics = {
  maxNumCases: number;
  minNumCases: number;
  numCases: number;
  statisticsPerRegion: Record<string, { numCases: number; region: CaseDbRegion; rows: CaseDbCase[] }>;
};

type GenEpixPieSeriesOptionData = Array<GenEpixPieSeriesOptionEventData & UnwrapArray<PieSeriesOption['data']>>;

type GeoJsonBounds = [number, number, number, number];
type GeoJsonFeature = {
  bbox?: number[];
  geometry?: GeoJsonGeometry | null;
};
type GeoJsonGeometry = {
  bbox?: number[];
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
};
type GeoJsonObject = {
  bbox?: number[];
  coordinates?: unknown;
  features?: GeoJsonFeature[];
  geometries?: GeoJsonGeometry[];
  geometry?: GeoJsonGeometry | null;
};

export class EpiMapUtil {
  public static getGeoJsonAspectScale(geoJson: string) {
    const bounds = EpiMapUtil.getGeoJsonBounds(geoJson);
    if (!bounds) {
      return 1;
    }

    const centerLatitude = (bounds[1] + bounds[3]) / 2;
    if (!Number.isFinite(centerLatitude) || Math.abs(centerLatitude) > 90) {
      return 1;
    }

    const aspectScale = Math.cos(centerLatitude * Math.PI / 180);
    return Number.isFinite(aspectScale) && aspectScale > 0 ? aspectScale : 1;
  }

  public static getMapSeries(
    col: CaseDbCol | null,
    regions: CaseDbRegion[],
    sortedData: CaseDbCase[],
    stratification: null | Stratification,
    getPieChartRadius: (numCases: number) => number,
  ): { epiMapCaseCount: number; series: PieSeriesOption[] } {
    if (!col || !regions) {
      return {
        epiMapCaseCount: undefined,
        series: [],
      };
    }

    const pieSeriesOptions: PieSeriesOption[] = [];

    const { numCases: totalNumCases, statisticsPerRegion } = EpiMapUtil.getRegionStatistics(sortedData, col.id, regions);

    const pieChartOptionsBase: Partial<PieSeriesOption> = {
      animation: false,
      coordinateSystem: 'geo',
      label: {
        show: false,
        silent: true,
      },
      labelLine: {
        show: true,
        smooth: true,
      },
      type: 'pie',
    };

    Object.entries(statisticsPerRegion).forEach(([regionId, regionData]) => {
      const data: GenEpixPieSeriesOptionData = [];

      if (!stratification) {
        const caseIds = regionData.rows.map(row => row.id);
        if (caseIds.length === 0) {
          return;
        }
        data.push({
          emphasis: {
            focus: 'self',
          },
          genEpixData: {
            caseIds,
            regionId,
          },
          label: {
            formatter: () => regionData.region.name,
          },
          name: 'num-cases',
          value: regionData.numCases,
        });
      } else {
        stratification.legendaItems.forEach(legendaItem => {
          const rows = regionData.rows.filter(row => legendaItem.caseIds.includes(row.id));
          const caseIds = rows.map(row => row.id);
          const numCases = DashboardUtil.getCaseCount(rows);
          data.push({
            emphasis: {
              focus: 'self',
            },
            genEpixData: {
              caseIds,
              regionId,
            },
            label: {
              formatter: () => regionData.region.name,
            },
            name: legendaItem.rowValue.full,
            value: numCases,
          });
        });
      }

      pieSeriesOptions.push({
        ...pieChartOptionsBase,
        center: [regionData.region.center_lon, regionData.region.center_lat],
        data,
        radius: getPieChartRadius(regionData.numCases),
        tooltip: {
          formatter: (callbackParams) => {
            const d = (callbackParams as { data: { name: string; value: number } }).data;
            if (stratification) {
              return `${regionData.region.name} - ${d.name} (n=${d.value}, ${Math.round(d.value / regionData.numCases * 100)}%)`;
            }
            return `${regionData.region.name} (n=${regionData.numCases}, ${Math.round(regionData.numCases / totalNumCases * 100)}%)`;
          },
        },
      });
    });

    return {
      epiMapCaseCount: totalNumCases,
      series: pieSeriesOptions,
    };
  }

  public static getMaxPieChartArea(width: number, height: number, numZones: number): number {
    if (!width || !height || !numZones) {
      return 0;
    }
    const smallestDimension = Math.min(width, height);
    const mapArea = smallestDimension ** 2;
    const zoneArea = mapArea / numZones;
    const zoneDimension = Math.sqrt(zoneArea);
    const normalizedZoneDimension = zoneDimension / 4;
    const zonePieArea = ((normalizedZoneDimension / 2) ** 2) * Math.PI;
    return zonePieArea;
  }

  public static getPieChartRadius(numCases: number, maxPieChartArea: number, statistics: RegionStatistics) {
    const { maxNumCases, minNumCases } = statistics;
    const { MIN_PIE_CHART_RADIUS } = ConfigManager.getInstance<CaseDbConfig>().config.epiMap;
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

  public static getRegionStatistics(cases: CaseDbCase[], columnId: string, regions: CaseDbRegion[]): RegionStatistics {
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
      numCases: number;
      region: CaseDbRegion;
      rows: CaseDbCase[];
    }> = {};
    cases.forEach(row => {
      const regionId = row.content[columnId];
      if (!regionId) {
        return;
      }
      if (!statisticsPerRegion[regionId]) {
        statisticsPerRegion[regionId] = {
          numCases: 0,
          region: regions.find(region => region.id === regionId),
          rows: [],
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
      maxNumCases,
      minNumCases,
      numCases,
      statisticsPerRegion,
    };
  }

  private static createEmptyBounds(): GeoJsonBounds {
    return [Infinity, Infinity, -Infinity, -Infinity];
  }

  private static expandBoundsFromCoordinates(bounds: GeoJsonBounds, coordinates: unknown) {
    if (!Array.isArray(coordinates) || !coordinates.length) {
      return;
    }

    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      const [longitude, latitude] = coordinates as [number, number];

      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return;
      }

      bounds[0] = Math.min(bounds[0], longitude);
      bounds[1] = Math.min(bounds[1], latitude);
      bounds[2] = Math.max(bounds[2], longitude);
      bounds[3] = Math.max(bounds[3], latitude);
      return;
    }

    coordinates.forEach(childCoordinates => EpiMapUtil.expandBoundsFromCoordinates(bounds, childCoordinates));
  }

  private static expandBoundsFromFeature(bounds: GeoJsonBounds, feature?: GeoJsonFeature | null) {
    if (!feature) {
      return;
    }

    const bboxBounds = EpiMapUtil.normalizeBounds(feature.bbox);
    if (bboxBounds) {
      EpiMapUtil.mergeBounds(bounds, bboxBounds);
      return;
    }

    EpiMapUtil.expandBoundsFromGeometry(bounds, feature.geometry);
  }

  private static expandBoundsFromGeometry(bounds: GeoJsonBounds, geometry?: GeoJsonGeometry | null) {
    if (!geometry) {
      return;
    }

    const bboxBounds = EpiMapUtil.normalizeBounds(geometry.bbox);
    if (bboxBounds) {
      EpiMapUtil.mergeBounds(bounds, bboxBounds);
      return;
    }

    EpiMapUtil.expandBoundsFromCoordinates(bounds, geometry.coordinates);
    geometry.geometries?.forEach(childGeometry => EpiMapUtil.expandBoundsFromGeometry(bounds, childGeometry));
  }

  private static getGeoJsonBounds(geoJson: string): GeoJsonBounds | null {
    try {
      const parsedGeoJson = JSON.parse(geoJson) as GeoJsonObject;
      return EpiMapUtil.getGeoJsonObjectBounds(parsedGeoJson);
    } catch {
      return null;
    }
  }

  private static getGeoJsonObjectBounds(geoJson: GeoJsonObject): GeoJsonBounds | null {
    const bboxBounds = EpiMapUtil.normalizeBounds(geoJson.bbox);
    if (bboxBounds) {
      return bboxBounds;
    }

    const bounds = EpiMapUtil.createEmptyBounds();
    EpiMapUtil.expandBoundsFromCoordinates(bounds, geoJson.coordinates);
    geoJson.features?.forEach(feature => EpiMapUtil.expandBoundsFromFeature(bounds, feature));
    geoJson.geometries?.forEach(geometry => EpiMapUtil.expandBoundsFromGeometry(bounds, geometry));
    EpiMapUtil.expandBoundsFromGeometry(bounds, geoJson.geometry);

    return EpiMapUtil.hasBounds(bounds) ? bounds : null;
  }

  private static hasBounds(bounds: GeoJsonBounds) {
    return bounds.every(Number.isFinite);
  }

  private static mergeBounds(bounds: GeoJsonBounds, otherBounds: GeoJsonBounds) {
    bounds[0] = Math.min(bounds[0], otherBounds[0]);
    bounds[1] = Math.min(bounds[1], otherBounds[1]);
    bounds[2] = Math.max(bounds[2], otherBounds[2]);
    bounds[3] = Math.max(bounds[3], otherBounds[3]);
  }

  private static normalizeBounds(bounds?: number[]): GeoJsonBounds | null {
    if (!bounds || bounds.length < 4) {
      return null;
    }

    const normalizedBounds = bounds.slice(0, 4) as GeoJsonBounds;
    return normalizedBounds.every(Number.isFinite) ? normalizedBounds : null;
  }
}
