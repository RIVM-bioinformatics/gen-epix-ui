import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCaseApi,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbGeoApi,
  CaseDbOntologyApi,
  CaseDbOrganization,
  CaseDbOrganizationApi,
  CaseDbRegion,
  CaseDbRegionSet,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { CASEDB_QUERY_KEY } from '../../../constants/query.constants';

import { DataService } from './DataService';

const createConceptSet = (id: string): CaseDbConceptSet => ({
  code: id,
  id,
  name: id,
  type: 'NOMINAL',
});

const createConcept = (id: string, conceptSetId: string, props: unknown): CaseDbConcept => (({
  code: id,
  concept_set_id: conceptSetId,
  id,
  name: id,
  props,
}));

const createRegionSet = (id: string): CaseDbRegionSet => ({
  code: id,
  id,
  name: id,
  region_code_as_label: false,
  resolution: 1,
});

const createRegion = (id: string, regionSetId: string): CaseDbRegion => ({
  center_lat: 0,
  center_lon: 0,
  centroid_lat: 0,
  centroid_lon: 0,
  code: id,
  id,
  name: id,
  region_set_id: regionSetId,
});

const createOrganization = (id: string): CaseDbOrganization => ({
  code: id,
  id,
  name: id,
});

const createTreeAlgorithm = (name: string, rank?: null | number): CaseDbTreeAlgorithm => ({
  code: 'NJ',
  is_ultrametric: false,
  name,
  seqdb_tree_algorithm_id: `${name}-seqdb-id`,
  tree_algorithm_class_id: `${name}-class-id`,
  ...(rank === undefined ? {} : { rank }),
});

const createCompleteCaseType = (regionSetIds: string[], hasTreeAlgorithms = true): CaseDbCompleteCaseType => {
  const orderedColIds = regionSetIds.map((_regionSetId, index) => `col-${index}`);
  const cols = Object.fromEntries(orderedColIds.map((colId, index) => [colId, { ref_col_id: `ref-col-${index}` }]));
  const refCols = Object.fromEntries(regionSetIds.map((regionSetId, index) => [`ref-col-${index}`, { region_set_id: regionSetId }]));

  return {
    cols,
    ordered_col_ids: orderedColIds,
    ref_cols: refCols,
    tree_algorithms: hasTreeAlgorithms ? {} : null,
  } as unknown as CaseDbCompleteCaseType;
};

const setCache = <T>(queryClientService: QueryClientService, queryKey: string, value: T): void => {
  queryClientService.queryClient.setQueryData(queryClientService.getGenericKey(queryKey), value);
};

const createService = () => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const conceptSetsGetAll = vi.fn();
  const conceptsGetAll = vi.fn();
  const regionSetsPostQuery = vi.fn();
  const regionsPostQuery = vi.fn();
  const organizationsGetAll = vi.fn();
  const treeAlgorithmsGetAll = vi.fn();
  const dataService = new DataService(
    queryClientService,
    { treeAlgorithmsGetAll } as unknown as CaseDbCaseApi,
    { regionSetsPostQuery, regionsPostQuery } as unknown as CaseDbGeoApi,
    { conceptSetsGetAll, conceptsGetAll } as unknown as CaseDbOntologyApi,
    { organizationsGetAll } as unknown as CaseDbOrganizationApi,
  );

  return {
    conceptSetsGetAll,
    conceptsGetAll,
    dataService,
    organizationsGetAll,
    queryClientService,
    regionSetsPostQuery,
    regionsPostQuery,
    treeAlgorithmsGetAll,
  };
};

describe('DataService', () => {
  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
  });

  it('starts with empty lookup caches', () => {
    const { dataService } = createService();

    expect(dataService.data).toEqual({
      conceptsById: {},
      conceptsBySetId: {},
      conceptSets: {},
      conceptsIdsBySetId: {},
      organizations: [],
      organizationsById: {},
      regionsById: {},
      regionsByRegionSetId: {},
      regionSets: {},
      treeAlgorithms: [],
      userDataCollections: [],
      userDataCollectionsById: {},
    });
  });

  it('skips loading concepts when both query caches are present', async () => {
    const { conceptSetsGetAll, conceptsGetAll, dataService, queryClientService } = createService();
    setCache(queryClientService, CASEDB_QUERY_KEY.CONCEPT_SETS, [createConceptSet('set-1')]);
    setCache(queryClientService, CASEDB_QUERY_KEY.CONCEPTS, [createConcept('concept-1', 'set-1', {})]);

    await dataService.loadConcepts(signal);

    expect(conceptSetsGetAll).not.toHaveBeenCalled();
    expect(conceptsGetAll).not.toHaveBeenCalled();
    expect(dataService.data.conceptSets).toEqual({});
  });

  it('loads and indexes concept sets and concepts, including malformed props', async () => {
    const {
      conceptSetsGetAll,
      conceptsGetAll,
      dataService,
      queryClientService,
    } = createService();
    const conceptSet = createConceptSet('set-1');
    const duplicateConceptSet = createConceptSet('set-1');
    const validConcept = createConcept('concept-1', 'set-1', '{"parsed":true}');
    const malformedConcept = createConcept('concept-2', 'set-1', '{malformed');
    conceptSetsGetAll.mockResolvedValue({ data: [conceptSet, duplicateConceptSet] });
    conceptsGetAll.mockResolvedValue({ data: [validConcept, malformedConcept] });

    await dataService.loadConcepts(signal);

    expect(conceptSetsGetAll).toHaveBeenCalledWith(null, null, { signal });
    expect(conceptsGetAll).toHaveBeenCalledWith(null, null, { signal });
    expect(dataService.data.conceptSets).toEqual({ 'set-1': conceptSet });
    expect(dataService.data.conceptsBySetId).toEqual({ 'set-1': [validConcept, malformedConcept] });
    expect(dataService.data.conceptsIdsBySetId).toEqual({ 'set-1': ['concept-1', 'concept-2'] });
    expect(dataService.data.conceptsById).toEqual({ 'concept-1': validConcept, 'concept-2': malformedConcept });
    expect(validConcept.props).toEqual({ parsed: true });
    expect(malformedConcept.props).toBe('{malformed');
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS))).toEqual([conceptSet, duplicateConceptSet]);
  });

  it('uses cached concept sets while loading missing concepts', async () => {
    const { conceptSetsGetAll, conceptsGetAll, dataService, queryClientService } = createService();
    const conceptSet = createConceptSet('set-1');
    const concept = createConcept('concept-1', 'set-1', '{}');
    setCache(queryClientService, CASEDB_QUERY_KEY.CONCEPT_SETS, [conceptSet]);
    conceptsGetAll.mockResolvedValue({ data: [concept] });

    await dataService.loadConcepts(signal);

    expect(conceptSetsGetAll).not.toHaveBeenCalled();
    expect(conceptsGetAll).toHaveBeenCalledOnce();
    expect(dataService.data.conceptsById).toEqual({ 'concept-1': concept });
  });

  it('uses cached concepts while loading missing concept sets', async () => {
    const { conceptSetsGetAll, conceptsGetAll, dataService, queryClientService } = createService();
    const conceptSet = createConceptSet('set-1');
    const concept = createConcept('concept-1', 'set-1', { already: 'parsed' });
    setCache(queryClientService, CASEDB_QUERY_KEY.CONCEPTS, [concept]);
    conceptSetsGetAll.mockResolvedValue({ data: [conceptSet] });

    await dataService.loadConcepts(signal);

    expect(conceptSetsGetAll).toHaveBeenCalledOnce();
    expect(conceptsGetAll).not.toHaveBeenCalled();
    expect(dataService.data.conceptsBySetId).toEqual({ 'set-1': [concept] });
  });

  it('skips loading regions when no region set is referenced', async () => {
    const { dataService, regionSetsPostQuery, regionsPostQuery } = createService();

    await dataService.loadMissingRegions(createCompleteCaseType([]), signal);

    expect(regionSetsPostQuery).not.toHaveBeenCalled();
    expect(regionsPostQuery).not.toHaveBeenCalled();
  });

  it('skips loading regions when every referenced set is cached', async () => {
    const { dataService, queryClientService, regionSetsPostQuery, regionsPostQuery } = createService();
    setCache(queryClientService, CASEDB_QUERY_KEY.REGION_SETS_LAZY, [createRegionSet('set-1')]);
    setCache(queryClientService, CASEDB_QUERY_KEY.REGIONS_LAZY, [createRegion('region-1', 'set-1')]);

    await dataService.loadMissingRegions(createCompleteCaseType(['set-1']), signal);

    expect(regionSetsPostQuery).not.toHaveBeenCalled();
    expect(regionsPostQuery).not.toHaveBeenCalled();
  });

  it('loads missing regions when the lazy caches are absent', async () => {
    const { dataService, regionSetsPostQuery, regionsPostQuery } = createService();
    const regionSet = createRegionSet('set-1');
    const region = createRegion('region-1', 'set-1');
    regionSetsPostQuery.mockResolvedValue({ data: [regionSet] });
    regionsPostQuery.mockResolvedValue({ data: [region] });

    await dataService.loadMissingRegions(createCompleteCaseType(['set-1']), signal);

    expect(dataService.data.regionSets).toEqual({ 'set-1': regionSet });
    expect(dataService.data.regionsByRegionSetId).toEqual({ 'set-1': [region] });
    expect(dataService.data.regionsById).toEqual({ 'region-1': region });
  });

  it('loads missing regions and merges them into the cached indexes', async () => {
    const {
      dataService,
      queryClientService,
      regionSetsPostQuery,
      regionsPostQuery,
    } = createService();
    const existingRegionSet = createRegionSet('set-existing');
    const missingRegionSet = createRegionSet('set-missing');
    const existingRegion = createRegion('region-existing', 'set-existing');
    const missingRegionOne = createRegion('region-one', 'set-missing');
    const missingRegionTwo = createRegion('region-two', 'set-missing');
    setCache(queryClientService, CASEDB_QUERY_KEY.REGION_SETS_LAZY, [existingRegionSet]);
    setCache(queryClientService, CASEDB_QUERY_KEY.REGIONS_LAZY, [existingRegion]);
    regionSetsPostQuery.mockResolvedValue({ data: [missingRegionSet] });
    regionsPostQuery.mockResolvedValue({ data: [missingRegionOne, missingRegionTwo] });

    await dataService.loadMissingRegions(createCompleteCaseType(['set-missing', 'set-existing']), signal);

    expect(regionSetsPostQuery).toHaveBeenCalledWith({
      invert: false,
      key: 'id',
      members: ['set-missing'],
      type: 'UUID_SET',
    }, null, null, { signal });
    expect(regionsPostQuery).toHaveBeenCalledWith({
      invert: false,
      key: 'region_set_id',
      members: ['set-missing'],
      type: 'UUID_SET',
    }, null, null, { signal });
    expect(dataService.data.regionSets).toEqual({
      'set-existing': existingRegionSet,
      'set-missing': missingRegionSet,
    });
    expect(dataService.data.regionsByRegionSetId).toEqual({
      'set-existing': [existingRegion],
      'set-missing': [missingRegionOne, missingRegionTwo],
    });
    expect(dataService.data.regionsById).toEqual({
      'region-existing': existingRegion,
      'region-one': missingRegionOne,
      'region-two': missingRegionTwo,
    });
  });

  it('skips loading organizations when the query cache is present', async () => {
    const { dataService, organizationsGetAll, queryClientService } = createService();
    setCache(queryClientService, COMMON_QUERY_KEY.ORGANIZATIONS, [createOrganization('organization-1')]);

    await dataService.loadOrganizations(signal);

    expect(organizationsGetAll).not.toHaveBeenCalled();
    expect(dataService.data.organizations).toEqual([]);
  });

  it('loads and indexes organizations when the query cache is missing', async () => {
    const { dataService, organizationsGetAll, queryClientService } = createService();
    const organizations = [createOrganization('organization-1'), createOrganization('organization-2')];
    organizationsGetAll.mockResolvedValue({ data: organizations });

    await dataService.loadOrganizations(signal);

    expect(organizationsGetAll).toHaveBeenCalledWith(null, null, { signal });
    expect(dataService.data.organizations).toEqual(organizations);
    expect(dataService.data.organizationsById).toEqual({
      'organization-1': organizations[0],
      'organization-2': organizations[1],
    });
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS))).toEqual(organizations);
  });

  it('skips tree algorithms when the case type has none', async () => {
    const { dataService, treeAlgorithmsGetAll } = createService();

    await dataService.loadTreeAlgorithms(createCompleteCaseType([], false), signal);

    expect(treeAlgorithmsGetAll).not.toHaveBeenCalled();
  });

  it('skips tree algorithms when their query cache is present', async () => {
    const { dataService, queryClientService, treeAlgorithmsGetAll } = createService();
    const cachedAlgorithms = [createTreeAlgorithm('cached')];
    setCache(queryClientService, CASEDB_QUERY_KEY.TREE_ALGORITHMS, cachedAlgorithms);

    await dataService.loadTreeAlgorithms(createCompleteCaseType([]), signal);

    expect(treeAlgorithmsGetAll).not.toHaveBeenCalled();
    expect(dataService.data.treeAlgorithms).toEqual([]);
  });

  it('loads and sorts tree algorithms by rank before unranked name', async () => {
    const { dataService, queryClientService, treeAlgorithmsGetAll } = createService();
    const algorithms = [
      createTreeAlgorithm('zeta', null),
      createTreeAlgorithm('rank-one', 1),
      createTreeAlgorithm('rank-zero', 0),
      createTreeAlgorithm('alpha'),
      createTreeAlgorithm('rank-two', 2),
    ];
    treeAlgorithmsGetAll.mockResolvedValue({ data: algorithms });

    await dataService.loadTreeAlgorithms(createCompleteCaseType([]), signal);

    expect(treeAlgorithmsGetAll).toHaveBeenCalledWith(null, null, { signal });
    expect(dataService.data.treeAlgorithms.map(algorithm => algorithm.name)).toEqual([
      'rank-zero',
      'rank-one',
      'rank-two',
      'alpha',
      'zeta',
    ]);
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.TREE_ALGORITHMS))).toEqual(dataService.data.treeAlgorithms);
  });
});
