import max from 'lodash/max';
import min from 'lodash/min';
import round from 'lodash/round';
import type {
  CaseDbCase,
  CaseDbRegion,
} from '@gen-epix/api-casedb';

import { ConfigManager } from '../../../../ui/src/classes/managers/ConfigManager';

export type RegionStatistics = {
  maxNumCases: number;
  minNumCases: number;
  numCases: number;
  statisticsPerRegion: Record<string, { numCases: number; region: CaseDbRegion; rows: CaseDbCase[] }>;
};

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

  public static getPieChartRadius(numCases: number, maxPieChartArea: number, statistics: RegionStatistics) {
    const { maxNumCases, minNumCases } = statistics;
    const { MIN_PIE_CHART_RADIUS } = ConfigManager.getInstance().config.epiMap;
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
