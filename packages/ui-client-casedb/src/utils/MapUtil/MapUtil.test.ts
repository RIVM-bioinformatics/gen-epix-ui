import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbRegion,
} from '@gen-epix/api-casedb';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../models/config.models';
import type { Stratification } from '../../models/stratification.models';
import { STRATIFICATION_MODE } from '../../models/stratification.models';

import type { RegionStatistics } from './MapUtil';
import { MapUtil } from './MapUtil';

const makeRegion = (id: string, name: string, centerLon = 5, centerLat = 52): CaseDbRegion => ({
  center_lat: centerLat,
  center_lon: centerLon,
  id,
  name,
} as CaseDbRegion);

const makeCase = (id: string, regionId?: string, count?: number): CaseDbCase => ({
  content: regionId ? { region: regionId } : {},
  count,
  id,
} as CaseDbCase);

const makeColumn = (): CaseDbCol => ({ id: 'region' } as CaseDbCol);

describe('MapUtil', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('getGeoJsonAspectScale', () => {
    it('determines the aspect scale from geojson bounds', () => {
      const geoJson = JSON.stringify({
        bbox: [3, 50, 8, 54],
        features: [],
        type: 'FeatureCollection',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
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

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('falls back to 1 when geojson can not be parsed', () => {
      expect(MapUtil.getGeoJsonAspectScale('not-json')).toBe(1);
    });

    it('falls back to 1 when no valid bounds can be found', () => {
      expect(MapUtil.getGeoJsonAspectScale(JSON.stringify({ features: [], type: 'FeatureCollection' }))).toBe(1);
    });

    it('falls back to 1 when bbox latitude is outside the valid range', () => {
      expect(MapUtil.getGeoJsonAspectScale(JSON.stringify({ bbox: [0, 91, 1, 93] }))).toBe(1);
    });

    it('falls back to 1 when bbox coordinates are not finite', () => {
      expect(MapUtil.getGeoJsonAspectScale(JSON.stringify({ bbox: [0, 0, 'invalid', 1] }))).toBe(1);
    });

    it('uses geometry bbox bounds when root bbox is missing', () => {
      const geoJson = JSON.stringify({
        geometries: [{ bbox: [2, 50, 8, 54] }],
        type: 'GeometryCollection',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('uses root geometry coordinates when no bbox is present', () => {
      const geoJson = JSON.stringify({
        geometry: { coordinates: [[1, 50], [5, 54]], type: 'MultiPoint' },
        type: 'Feature',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('merges valid feature bboxes and ignores features without geometry', () => {
      const geoJson = JSON.stringify({
        features: [
          null,
          { bbox: [1, 50, 3, 52] },
          { bbox: [5, 54, 7, 56] },
        ],
        type: 'FeatureCollection',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(53 * Math.PI / 180));
    });

    it('falls back from an invalid feature bbox to its geometry coordinates', () => {
      const geoJson = JSON.stringify({
        features: [{
          bbox: [1, 2, 3],
          geometry: { coordinates: [[2, 50], [4, 54]], type: 'MultiPoint' },
        }],
        type: 'FeatureCollection',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('traverses nested geometry collections and skips invalid coordinate leaves', () => {
      const geoJson = JSON.stringify({
        geometries: [{
          geometries: [
            { coordinates: [[null, 50], [2, null], [4, 54]] },
            null,
          ],
        }],
        type: 'GeometryCollection',
      });

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(54 * Math.PI / 180));
    });

    it('skips non-finite coordinate pairs', () => {
      const geoJson = '{"coordinates":[[1e999,50],[2,52]],"type":"MultiPoint"}';

      expect(MapUtil.getGeoJsonAspectScale(geoJson)).toBeCloseTo(Math.cos(52 * Math.PI / 180));
    });

    it('falls back to one when the computed aspect scale is non-positive', () => {
      vi.spyOn(Math, 'cos').mockReturnValue(0);

      expect(MapUtil.getGeoJsonAspectScale(JSON.stringify({ bbox: [0, 50, 1, 54] }))).toBe(1);
    });
  });

  describe('getRegionStatistics', () => {
    it('returns zeroed statistics when cases, column ID, or regions are missing', () => {
      const region = makeRegion('region-1', 'Region one');
      const emptyStatistics = {
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 0,
        statisticsPerRegion: {},
      };

      expect(MapUtil.getRegionStatistics([], 'region', [region])).toEqual(emptyStatistics);
      expect(MapUtil.getRegionStatistics([makeCase('case-1', 'region-1')], '', [region])).toEqual(emptyStatistics);
      expect(MapUtil.getRegionStatistics([makeCase('case-1', 'region-1')], 'region', [])).toEqual(emptyStatistics);
    });

    it('groups cases by known region and defaults null counts to one', () => {
      const firstRegion = makeRegion('region-1', 'Region one');
      const secondRegion = makeRegion('region-2', 'Region two');
      const firstCase = makeCase('case-1', 'region-1', null);
      const secondCase = makeCase('case-2', 'region-1', 3);
      const thirdCase = makeCase('case-3', 'region-2', 2);

      expect(MapUtil.getRegionStatistics(
        [firstCase, secondCase, thirdCase],
        'region',
        [firstRegion, secondRegion],
      )).toEqual({
        maxNumCases: 4,
        minNumCases: 2,
        numCases: 6,
        statisticsPerRegion: {
          'region-1': { numCases: 4, region: firstRegion, rows: [firstCase, secondCase] },
          'region-2': { numCases: 2, region: secondRegion, rows: [thirdCase] },
        },
      });
    });

    it('returns zero min and max when no cases have a known region ID', () => {
      const region = makeRegion('region-1', 'Region one');

      expect(MapUtil.getRegionStatistics([
        makeCase('missing-region'),
        makeCase('unknown-region', 'region-unknown', 5),
      ], 'region', [region])).toEqual({
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 0,
        statisticsPerRegion: {},
      });
    });
  });

  describe('getMapSeries', () => {
    const getRadius = (numCases: number): number => numCases + 10;

    it('returns an empty result when the column or region list is absent', () => {
      expect(MapUtil.getMapSeries(null, [makeRegion('region-1', 'Region one')], [], null, getRadius)).toEqual({
        mapCaseCount: undefined,
        series: [],
      });
      expect(MapUtil.getMapSeries(makeColumn(), null, [], null, getRadius)).toEqual({
        mapCaseCount: undefined,
        series: [],
      });
    });

    it('creates a pie series for cases without stratification', () => {
      const region = makeRegion('region-1', 'Region one');
      const cases = [makeCase('case-1', 'region-1', 3), makeCase('case-2', 'region-1', null)];
      const radiusSpy = vi.fn(getRadius);
      const result = MapUtil.getMapSeries(makeColumn(), [region], cases, null, radiusSpy);
      const pie = result.series[0] as unknown as {
        center: number[];
        data: Array<{
          genEpixData: { caseIds: string[]; regionId: string };
          label: { formatter: () => string };
          name: string;
          value: number;
        }>;
        radius: number;
        tooltip: { formatter: (params: unknown) => string };
      };

      expect(result.mapCaseCount).toBe(4);
      expect(result.series).toHaveLength(1);
      expect(pie.center).toEqual([5, 52]);
      expect(pie.radius).toBe(14);
      expect(radiusSpy).toHaveBeenCalledWith(4);
      expect(pie.data).toHaveLength(1);
      expect(pie.data[0]).toMatchObject({
        genEpixData: { caseIds: ['case-1', 'case-2'], regionId: 'region-1' },
        name: 'num-cases',
        value: 4,
      });
      expect(pie.data[0].label.formatter()).toBe('Region one');
      expect(pie.tooltip.formatter({ data: { name: 'num-cases', value: 4 } })).toBe('Region one (n=4, 100%)');
    });

    it('creates one pie datum per stratification item and formats its tooltip', () => {
      const region = makeRegion('region-1', 'Region one');
      const cases = [makeCase('case-1', 'region-1', 3), makeCase('case-2', 'region-1', 1)];
      const stratification: Stratification = {
        caseIdColors: {},
        colorForIsMissing: '#ccc',
        legendaItems: [
          { caseIds: ['case-1'], color: '#f00', rowValue: { full: 'A', long: 'A', raw: 'a', short: 'A' } },
          { caseIds: ['case-2'], color: '#00f', rowValue: { full: 'B', long: 'B', raw: 'b', short: 'B' } },
        ],
        mode: STRATIFICATION_MODE.FIELD,
      };
      const result = MapUtil.getMapSeries(makeColumn(), [region], cases, stratification, getRadius);
      const pie = result.series[0] as unknown as {
        data: Array<{
          genEpixData: { caseIds: string[]; regionId: string };
          label: { formatter: () => string };
          name: string;
          value: number;
        }>;
        tooltip: { formatter: (params: unknown) => string };
      };

      expect(pie.data).toHaveLength(2);
      expect(pie.data.map(item => item.value)).toEqual([3, 1]);
      expect(pie.data.map(item => item.genEpixData.caseIds)).toEqual([['case-1'], ['case-2']]);
      expect(pie.data[0].label.formatter()).toBe('Region one');
      expect(pie.tooltip.formatter({ data: { name: 'A', value: 3 } })).toBe('Region one - A (n=3, 75%)');
    });

    it('returns no series when cases do not reference known regions', () => {
      const result = MapUtil.getMapSeries(
        makeColumn(),
        [makeRegion('region-1', 'Region one')],
        [makeCase('case-1', 'region-unknown')],
        null,
        getRadius,
      );

      expect(result).toEqual({ mapCaseCount: 0, series: [] });
    });

    it('omits empty unstratified pie series', () => {
      const region = makeRegion('region-1', 'Region one');
      vi.spyOn(MapUtil, 'getRegionStatistics').mockReturnValue({
        maxNumCases: 0,
        minNumCases: 0,
        numCases: 0,
        statisticsPerRegion: {
          'region-1': { numCases: 0, region, rows: [] },
        },
      });

      expect(MapUtil.getMapSeries(makeColumn(), [region], [], null, getRadius)).toEqual({
        mapCaseCount: 0,
        series: [],
      });
    });
  });

  describe('getMaxPieChartArea', () => {
    it.each([
      [0, 100, 2],
      [100, 0, 2],
      [100, 100, 0],
    ])('returns zero for non-positive dimensions or zone count', (width, height, numZones) => {
      expect(MapUtil.getMaxPieChartArea(width, height, numZones)).toBe(0);
    });

    it('calculates the maximum zone pie area using the smaller map dimension', () => {
      expect(MapUtil.getMaxPieChartArea(400, 200, 4)).toBeCloseTo(156.25 * Math.PI);
    });
  });

  describe('getPieChartRadius', () => {
    beforeAll(() => {
      DependencyContainerUtil.createContainer({
        map: {
          MIN_PIE_CHART_RADIUS: 4,
        },
      } as CaseDbConfig);
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
        [[1, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], DependencyContainerUtil.resolveConfig<CaseDbConfig>().map.MIN_PIE_CHART_RADIUS],
        // test where numCases === maxNumCases (result should be maxArea
        [[9, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], 21.76],
        // test where numCases is some where in between minNumCases and maxNumCases (area should be proportional)
        [[6, 1487, { ...statisticsBase, maxNumCases: 9, minNumCases: 1 }], 17.37],
      ];

      testCases.forEach(([input, expectedOutput]) => {
        expect(MapUtil.getPieChartRadius(...input)).toEqual(expectedOutput);
      });
    });
  });
});
