import type {
  CompleteCaseType,
  TreeAlgorithm,
  RegionSet,
  Region,
  ConceptSet,
  Concept,
  Organization,
} from '../../api';
import {
  CaseApi,
  GeoApi,
  OntologyApi,
  OrganizationApi,
} from '../../api';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { QUERY_KEY } from '../../models/query';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { QueryUtil } from '../QueryUtil';
import type { EpiData } from '../../models/epi';

export class EpiDataUtil {
  public static readonly data: EpiData = {
    organizations: [],
    organizationsById: {},
    conceptSets: {},
    conceptsBySetId: {},
    conceptsIdsBySetId: {},
    conceptsById: {},
    regionSets: {},
    regionsByRegionSetId: {},
    regionsById: {},
    userDataCollections: [],
    userDataCollectionsById: {},
    treeAlgorithms: [],
  };

  public static async loadTreeAlgorithms(completeCaseType: CompleteCaseType, signal: AbortSignal): Promise<void> {
    if (!completeCaseType.tree_algorithms) {
      return;
    }
    const { queryClient } = QueryClientManager.instance;
    const queryKey = QueryUtil.getGenericKey(QUERY_KEY.TREE_ALGORITHMS);

    const currentTreeAlgorithms = QueryUtil.getValidQueryData<TreeAlgorithm[]>(queryKey);
    if (currentTreeAlgorithms) {
      return;
    }
    const treeAlgorithms = (await CaseApi.instance.treeAlgorithmsGetAll({ signal })).data.sort((a, b) => {
      if (a.rank === b.rank) {
        return a.name.localeCompare(b.name);
      }
      return a.rank - b.rank;
    });
    queryClient.setQueryData(queryKey, treeAlgorithms);
    EpiDataUtil.data.treeAlgorithms = treeAlgorithms;
  }

  public static async loadMissingRegions(completeCaseType: CompleteCaseType, signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    const regionSetIds = EpiDataUtil.getMissingRegionSetIds(completeCaseType);
    if (!regionSetIds.length) {
      return;
    }

    const currentRegionSets = QueryUtil.getValidQueryData<RegionSet[]>(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? [];
    const currentRegions = QueryUtil.getValidQueryData<Region[]>(QueryUtil.getGenericKey(QUERY_KEY.REGIONS_LAZY)) ?? [];

    const regionSetsResult = (await GeoApi.instance.regionSetsPostQuery({
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: regionSetIds,
    }, { signal })).data;
    const regionSets = [...regionSetsResult, ...currentRegionSets];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY), regionSets);

    const regionsResult = (await GeoApi.instance.regionsPostQuery({
      invert: false,
      key: 'region_set_id',
      type: 'UUID_SET',
      members: regionSetIds,
    }, { signal })).data;
    const regions = [...regionsResult, ...currentRegions];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.REGIONS_LAZY), regions);

    // Rebuild the cache
    EpiDataUtil.data.regionSets = {};
    EpiDataUtil.data.regionsByRegionSetId = {};
    EpiDataUtil.data.regionsById = {};

    regionSets.forEach(regionSet => {
      EpiDataUtil.data.regionSets[regionSet.id] = regionSet;
    });

    regions.forEach(region => {
      if (!EpiDataUtil.data.regionsByRegionSetId[region.region_set_id]) {
        EpiDataUtil.data.regionsByRegionSetId[region.region_set_id] = [];
      }
      EpiDataUtil.data.regionsByRegionSetId[region.region_set_id].push(region);
      EpiDataUtil.data.regionsById[region.id] = region;
    });
  }

  public static async loadConcepts(signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    let conceptSets = QueryUtil.getValidQueryData<ConceptSet[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS)) ?? null;
    let concepts = QueryUtil.getValidQueryData<Concept[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS)) ?? null;

    if (conceptSets !== null && concepts !== null) {
      return;
    }

    if (conceptSets === null) {
      conceptSets = (await OntologyApi.instance.conceptSetsGetAll({ signal })).data;
      queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS), conceptSets);
    }

    if (concepts === null) {
      concepts = (await OntologyApi.instance.conceptsGetAll({ signal })).data;
      queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS), concepts);
    }

    // Rebuild the cache
    EpiDataUtil.data.conceptSets = {};
    EpiDataUtil.data.conceptsBySetId = {};
    EpiDataUtil.data.conceptsIdsBySetId = {};
    EpiDataUtil.data.conceptsById = {};

    conceptSets.forEach(conceptSet => {
      EpiDataUtil.data.conceptSets[conceptSet.id] = conceptSet;
      if (!EpiDataUtil.data.conceptsBySetId[conceptSet.id]) {
        EpiDataUtil.data.conceptsBySetId[conceptSet.id] = [];
        EpiDataUtil.data.conceptsIdsBySetId[conceptSet.id] = [];
      }
    });

    concepts.forEach(concept => {
      EpiDataUtil.data.conceptsById[concept.id] = concept;
      EpiDataUtil.data.conceptsBySetId[concept.concept_set_id].push(concept);
      EpiDataUtil.data.conceptsIdsBySetId[concept.concept_set_id].push(concept.id);
    });
  }

  public static async loadOrganizations(signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    let organizations = QueryUtil.getValidQueryData<Organization[]>(QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS)) ?? null;

    if (organizations !== null) {
      return;
    }
    organizations = (await OrganizationApi.instance.organizationsGetAll({ signal })).data;
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS), organizations);

    // Rebuild the cache
    EpiDataUtil.data.organizationsById = {};
    EpiDataUtil.data.organizations = organizations;
    organizations.forEach(organization => {
      EpiDataUtil.data.organizationsById[organization.id] = organization;
    });
  }

  public static getRegionSetIds(completeCaseType: CompleteCaseType): string[] {
    const regionSetIds: string[] = [];
    const caseTypeColumns = EpiCaseTypeUtil.getCaseTypeCols(completeCaseType);
    caseTypeColumns.forEach(caseTypeCol => {
      const column = completeCaseType.cols[caseTypeCol.col_id];
      if (column.region_set_id && !regionSetIds.includes(column.region_set_id)) {
        regionSetIds.push(column.region_set_id);
      }
    });
    return regionSetIds;
  }

  private static getMissingRegionSetIds(completeCaseType: CompleteCaseType): string[] {
    const regionSetIds = EpiDataUtil.getRegionSetIds(completeCaseType);
    const currentRegionSetsIds = (QueryUtil.getValidQueryData<RegionSet[]>(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? []).map(x => x.id);
    return regionSetIds.filter(regionSetId => !currentRegionSetsIds.includes(regionSetId));
  }
}
