import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import {
  DateFilter,
  GeoFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  TextFilter,
} from '@gen-epix/ui-client-common/classes/filters';

import { DataService } from '../../classes/services/DataService';
import { SelectionFilter } from '../../classes/filters/SelectionFilter';
import { TreeFilter } from '../../classes/filters/TreeFilter';
import { CaseTypeUtil } from '../CaseTypeUtil';

import { FilterUtil } from './FilterUtil';

interface TestColumn {
  readonly colType: CaseDbColType;
  readonly conceptSetId?: string;
  readonly id: string;
  readonly maxValue?: null | number;
  readonly minValue?: null | number;
  readonly rank?: number;
  readonly regionSetId?: string;
}

interface TestDimension {
  readonly columns: TestColumn[];
  readonly dimType: CaseDbDimType;
  readonly id: string;
}

const createCompleteCaseType = (dimensions: TestDimension[]): CaseDbCompleteCaseType => {
  const dims: Record<string, { label: string; ref_dim_id: string }> = {};
  const refDims: Record<string, { description: string; dim_type: CaseDbDimType }> = {};
  const cols: Record<string, CaseDbCol> = {};
  const refCols: Record<string, CaseDbRefCol> = {};
  const orderedColIdsByDim: Record<string, string[]> = {};

  dimensions.forEach((dimension) => {
    const refDimId = `ref-dim-${dimension.id}`;
    dims[dimension.id] = { label: dimension.id, ref_dim_id: refDimId };
    refDims[refDimId] = { description: `${dimension.id} description`, dim_type: dimension.dimType };
    orderedColIdsByDim[dimension.id] = [];

    dimension.columns.forEach((column) => {
      const refColId = `ref-col-${column.id}`;
      cols[column.id] = {
        id: column.id,
        label: `Label ${column.id}`,
        max_value: column.maxValue,
        min_value: column.minValue,
        ref_col_id: refColId,
      } as CaseDbCol;
      refCols[refColId] = {
        col_type: column.colType,
        concept_set_id: column.conceptSetId,
        rank: column.rank ?? 2,
        region_set_id: column.regionSetId,
      } as CaseDbRefCol;
      orderedColIdsByDim[dimension.id].push(column.id);
    });
  });

  return {
    cols,
    dims,
    ordered_col_ids_by_dim: orderedColIdsByDim,
    ordered_dim_ids: dimensions.map(dimension => dimension.id),
    ref_cols: refCols,
    ref_dims: refDims,
  } as unknown as CaseDbCompleteCaseType;
};

const setDataService = (data: {
  readonly conceptsBySetId?: Record<string, CaseDbConcept[]>;
  readonly organizations?: CaseDbOrganization[];
  readonly regionsByRegionSetId?: Record<string, CaseDbRegion[]>;
  readonly regionSets?: Record<string, CaseDbRegionSet>;
} = {}): void => {
  container.registerInstance(DataService, {
    data: {
      conceptsBySetId: data.conceptsBySetId ?? {},
      organizations: data.organizations ?? [],
      regionsByRegionSetId: data.regionsByRegionSetId ?? {},
      regionSets: data.regionSets ?? {},
    },
  } as unknown as DataService);
};

afterEach(() => vi.restoreAllMocks());

describe('FilterUtil.createCategoricalFilter', () => {
  it.each([
    CaseDbColType.NOMINAL,
    CaseDbColType.ORDINAL,
    CaseDbColType.INTERVAL,
  ])('creates a multi-select filter for %s columns with concept options', (colType) => {
    setDataService({
      conceptsBySetId: {
        'concept-set-1': [
          { code: 'C1', id: 'concept-1', name: 'Concept one' } as CaseDbConcept,
        ],
      },
    });
    const completeCaseType = createCompleteCaseType([{
      columns: [{ colType, conceptSetId: 'concept-set-1', id: 'col-1' }],
      dimType: CaseDbDimType.TEXT,
      id: 'dim-1',
    }]);

    const filter = FilterUtil.createCategoricalFilter(completeCaseType.cols['col-1'], 'dim-1', completeCaseType);

    expect(filter).toBeInstanceOf(MultiSelectFilter);
    expect(filter instanceof MultiSelectFilter ? filter.options : undefined).toEqual([
      { label: 'C1 (Concept one)', value: 'concept-1' },
    ]);
  });

  it('falls back to a text filter when the ref column is not categorical', () => {
    setDataService({
      conceptsBySetId: {
        'concept-set-1': [{ code: 'C1', id: 'concept-1', name: 'Concept one' } as CaseDbConcept],
      },
    });
    const completeCaseType = createCompleteCaseType([{
      columns: [{ colType: CaseDbColType.TEXT, conceptSetId: 'concept-set-1', id: 'col-1' }],
      dimType: CaseDbDimType.TEXT,
      id: 'dim-1',
    }]);

    expect(FilterUtil.createCategoricalFilter(completeCaseType.cols['col-1'], 'dim-1', completeCaseType)).toBeInstanceOf(TextFilter);
  });

  it('falls back to a text filter when the concept set has no loaded options', () => {
    setDataService();
    const completeCaseType = createCompleteCaseType([{
      columns: [{ colType: CaseDbColType.NOMINAL, conceptSetId: 'missing-set', id: 'col-1' }],
      dimType: CaseDbDimType.TEXT,
      id: 'dim-1',
    }]);

    expect(FilterUtil.createCategoricalFilter(completeCaseType.cols['col-1'], 'dim-1', completeCaseType)).toBeInstanceOf(TextFilter);
  });
});

describe('FilterUtil.createFilterDimensions', () => {
  it('creates filter dimensions with type-specific preferred-column settings', () => {
    const completeCaseType = createCompleteCaseType([
      {
        columns: [{ colType: CaseDbColType.TIME_DAY, id: 'time-col', rank: 1 }],
        dimType: CaseDbDimType.TIME,
        id: 'time',
      },
      {
        columns: [
          { colType: CaseDbColType.GEO_REGION, id: 'geo-first' },
          { colType: CaseDbColType.GEO_REGION, id: 'geo-middle' },
          { colType: CaseDbColType.GEO_REGION, id: 'geo-last' },
        ],
        dimType: CaseDbDimType.GEO,
        id: 'geo',
      },
      {
        columns: [{ colType: CaseDbColType.NOMINAL, id: 'text-col', rank: 1 }],
        dimType: CaseDbDimType.TEXT,
        id: 'text',
      },
      {
        columns: [{ colType: CaseDbColType.DECIMAL_2, id: 'number-col', rank: 1 }],
        dimType: CaseDbDimType.NUMBER,
        id: 'number',
      },
      {
        columns: [{ colType: CaseDbColType.GENETIC_DISTANCE, id: 'genetic-col' }],
        dimType: CaseDbDimType.OTHER,
        id: 'genetic',
      },
      {
        columns: [
          { colType: CaseDbColType.GENETIC_SEQUENCE, id: 'blacklisted-col' },
          { colType: CaseDbColType.NOMINAL, id: 'mixed-col', rank: 1 },
        ],
        dimType: CaseDbDimType.TEXT,
        id: 'mixed',
      },
      {
        columns: [],
        dimType: CaseDbDimType.TEXT,
        id: 'empty',
      },
    ]);

    expect(FilterUtil.createFilterDimensions(completeCaseType)).toEqual([
      {
        allowMultipleVisibleFilters: false,
        allowOnlyPreferredFilter: true,
        description: 'time description',
        filterIds: ['time-col'],
        id: 'time',
        label: 'time',
        preferredFilterId: 'time-col',
      },
      {
        allowMultipleVisibleFilters: false,
        allowOnlyPreferredFilter: false,
        description: 'geo description',
        filterIds: ['geo-first', 'geo-middle', 'geo-last'],
        id: 'geo',
        label: 'geo',
        preferredFilterId: 'geo-middle',
      },
      {
        allowMultipleVisibleFilters: true,
        allowOnlyPreferredFilter: false,
        description: 'text description',
        filterIds: ['text-col'],
        id: 'text',
        label: 'text',
        preferredFilterId: 'text-col',
      },
      {
        allowMultipleVisibleFilters: false,
        allowOnlyPreferredFilter: false,
        description: 'number description',
        filterIds: ['number-col'],
        id: 'number',
        label: 'number',
        preferredFilterId: 'number-col',
      },
      {
        allowMultipleVisibleFilters: true,
        allowOnlyPreferredFilter: false,
        description: 'mixed description',
        filterIds: ['blacklisted-col', 'mixed-col'],
        id: 'mixed',
        label: 'mixed',
        preferredFilterId: 'mixed-col',
      },
    ]);
  });

  it('omits dimensions with no preferred column', () => {
    const completeCaseType = createCompleteCaseType([
      {
        columns: [{ colType: CaseDbColType.TIME_DAY, id: 'time-col' }],
        dimType: CaseDbDimType.TIME,
        id: 'time',
      },
      {
        columns: [{ colType: CaseDbColType.GEO_REGION, id: 'geo-col' }],
        dimType: CaseDbDimType.GEO,
        id: 'geo',
      },
      {
        columns: [{ colType: CaseDbColType.NOMINAL, id: 'text-col' }],
        dimType: CaseDbDimType.TEXT,
        id: 'text',
      },
    ]);
    vi.spyOn(CaseTypeUtil, 'getPreferredColInDimHavingHighestRank').mockReturnValue(undefined);
    vi.spyOn(CaseTypeUtil, 'getPreferredGEOCol').mockReturnValue(undefined);

    expect(FilterUtil.createFilterDimensions(completeCaseType)).toEqual([]);
  });
});

describe('FilterUtil.createFilters', () => {
  it('creates selection, tree, date, geo, categorical, number, organization, and text filters', () => {
    setDataService({
      conceptsBySetId: {
        'concept-set-1': [{ code: 'C1', id: 'concept-1', name: 'Concept one' } as CaseDbConcept],
      },
      organizations: [
        { id: 'org-1', name: 'Organization one' } as CaseDbOrganization,
        { id: 'org-2', name: 'Organization two' } as CaseDbOrganization,
      ],
      regionsByRegionSetId: {
        'region-set-1': [
          { code: 'R2', id: 'region-2', name: 'Region two' } as CaseDbRegion,
          { code: 'R1', id: 'region-1', name: 'Region one' } as CaseDbRegion,
        ],
      },
      regionSets: {
        'region-set-1': { id: 'region-set-1', region_code_as_label: true } as CaseDbRegionSet,
      },
    });
    const completeCaseType = createCompleteCaseType([
      {
        columns: [
          { colType: CaseDbColType.TIME_DAY, id: 'day-col' },
          { colType: CaseDbColType.TIME_QUARTER, id: 'quarter-col' },
        ],
        dimType: CaseDbDimType.TIME,
        id: 'time',
      },
      {
        columns: [{ colType: CaseDbColType.GEO_REGION, id: 'geo-col', regionSetId: 'region-set-1' }],
        dimType: CaseDbDimType.GEO,
        id: 'geo',
      },
      {
        columns: [
          { colType: CaseDbColType.NOMINAL, conceptSetId: 'concept-set-1', id: 'category-col' },
          { colType: CaseDbColType.TEXT, id: 'plain-text-col' },
        ],
        dimType: CaseDbDimType.TEXT,
        id: 'text',
      },
      {
        columns: [
          { colType: CaseDbColType.DECIMAL_2, id: 'bounded-number', maxValue: 10, minValue: 1 },
          { colType: CaseDbColType.DECIMAL_3, id: 'unbounded-number' },
          { colType: CaseDbColType.NOMINAL, conceptSetId: 'concept-set-1', id: 'number-category' },
        ],
        dimType: CaseDbDimType.NUMBER,
        id: 'number',
      },
      {
        columns: [{ colType: CaseDbColType.ORGANIZATION, id: 'organization-col' }],
        dimType: CaseDbDimType.ORGANIZATION,
        id: 'organization',
      },
      {
        columns: [{ colType: CaseDbColType.TEXT, id: 'other-col' }],
        dimType: CaseDbDimType.OTHER,
        id: 'other',
      },
      {
        columns: [{ colType: CaseDbColType.GENETIC_SEQUENCE, id: 'ignored-col' }],
        dimType: CaseDbDimType.OTHER,
        id: 'ignored',
      },
    ]);

    const filters = FilterUtil.createFilters(completeCaseType);
    const filtersById = new Map(filters.map(filter => [filter.id, filter]));

    expect(filters[0]).toBeInstanceOf(SelectionFilter);
    expect(filters[1]).toBeInstanceOf(TreeFilter);
    expect(filtersById.get('day-col')).toBeInstanceOf(DateFilter);
    expect((filtersById.get('day-col') as DateFilter).backendFilterType).toBe('DATE_RANGE');
    expect(filtersById.get('quarter-col')).toBeInstanceOf(DateFilter);
    expect((filtersById.get('quarter-col') as DateFilter).backendFilterType).toBe('PARTIAL_DATE_RANGE');
    expect(filtersById.get('geo-col')).toBeInstanceOf(GeoFilter);
    expect((filtersById.get('geo-col') as GeoFilter).options.map(option => option.label)).toEqual(['R1', 'R2']);
    expect(filtersById.get('category-col')).toBeInstanceOf(MultiSelectFilter);
    expect(filtersById.get('plain-text-col')).toBeInstanceOf(TextFilter);
    expect(filtersById.get('bounded-number')).toMatchObject({ max: 10, min: 1 });
    expect(filtersById.get('bounded-number')).toBeInstanceOf(NumberRangeFilter);
    expect(filtersById.get('unbounded-number')).toMatchObject({ max: Infinity, min: -Infinity });
    expect(filtersById.get('number-category')).toBeInstanceOf(MultiSelectFilter);
    expect((filtersById.get('organization-col') as MultiSelectFilter).options.map(option => option.label)).toEqual([
      'Organization one',
      'Organization two',
    ]);
    expect(filtersById.get('other-col')).toBeInstanceOf(TextFilter);
    expect(filtersById.has('ignored-col')).toBe(false);
  });

  it('creates an empty geo filter when no regions are loaded for its set', () => {
    setDataService({
      regionSets: {
        'region-set-1': { id: 'region-set-1', region_code_as_label: false } as CaseDbRegionSet,
      },
    });
    const completeCaseType = createCompleteCaseType([{
      columns: [{ colType: CaseDbColType.GEO_REGION, id: 'geo-col', regionSetId: 'region-set-1' }],
      dimType: CaseDbDimType.GEO,
      id: 'geo',
    }]);

    const geoFilter = FilterUtil.createFilters(completeCaseType).find(filter => filter.id === 'geo-col');

    expect(geoFilter).toBeInstanceOf(GeoFilter);
    expect(geoFilter instanceof GeoFilter ? geoFilter.options : undefined).toEqual([]);
  });

  it('uses region names when the region set is not code-labeled', () => {
    setDataService({
      regionsByRegionSetId: {
        'region-set-1': [{ code: 'R1', id: 'region-1', name: 'Region one' } as CaseDbRegion],
      },
      regionSets: {
        'region-set-1': { id: 'region-set-1', region_code_as_label: false } as CaseDbRegionSet,
      },
    });
    const completeCaseType = createCompleteCaseType([{
      columns: [{ colType: CaseDbColType.GEO_REGION, id: 'geo-col', regionSetId: 'region-set-1' }],
      dimType: CaseDbDimType.GEO,
      id: 'geo',
    }]);
    const geoFilter = FilterUtil.createFilters(completeCaseType).find(filter => filter.id === 'geo-col');

    expect(geoFilter instanceof GeoFilter ? geoFilter.options.map(option => option.label) : undefined).toEqual(['Region one']);
  });
});

describe('FilterUtil.createTextFilter', () => {
  it('creates a backend text filter with the column identity and label', () => {
    const col = { id: 'text-col', label: 'Text column' } as CaseDbCol;

    expect(FilterUtil.createTextFilter(col, 'dim-1')).toMatchObject({
      filterDimensionId: 'dim-1',
      id: 'text-col',
      label: 'Text column',
    });
  });
});

describe('FilterUtil.getDateParser', () => {
  it('parses quarter-formatted values and ISO date values', () => {
    const quarterParser = FilterUtil.getDateParser({ col_type: CaseDbColType.TIME_QUARTER } as CaseDbRefCol);
    const isoParser = FilterUtil.getDateParser({ col_type: CaseDbColType.TIME_DAY } as CaseDbRefCol);

    expect(quarterParser('2024-Q2').getMonth()).toBe(3);
    expect(quarterParser('2024-Q2').getFullYear()).toBe(2024);
    expect(isoParser('2024-03-15').getDate()).toBe(15);
    expect(isoParser('2024-03-15').getMonth()).toBe(2);
    expect(isoParser('2024-03-15').getFullYear()).toBe(2024);
  });
});
