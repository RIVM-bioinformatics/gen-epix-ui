import type {
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbOrganization,
  CaseDbRegion,
  CaseDbRegionSet,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbGeoApi,
  CaseDbOntologyApi,
  CaseDbOrganizationApi,
} from '@gen-epix/api-casedb';
import {
  HmrUtil,
  QueryClientManager,
  QueryManager,
} from '@gen-epix/ui';

import type { EpiData } from '../../../../../ui-casedb/src/models/epi';
import { QUERY_KEY } from '../../../models/query';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

export class EpiDataManager {
  private static __instance: EpiDataManager;

  public readonly data: EpiData = {
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
  };

  private constructor() {
    //
  }

  public static getInstance(): EpiDataManager {
    EpiDataManager.__instance = HmrUtil.getHmrSingleton('epiDataManager', EpiDataManager.__instance, () => new EpiDataManager());
    return EpiDataManager.__instance;
  }

  public getRegionSetIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const regionSetIds: string[] = [];
    const cols = CaseTypeUtil.getCols(completeCaseType);
    cols.forEach(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (refCol.region_set_id && !regionSetIds.includes(refCol.region_set_id)) {
        regionSetIds.push(refCol.region_set_id);
      }
    });
    return regionSetIds;
  }

  public async loadConcepts(signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.getInstance().queryClient;

    let conceptSets = QueryManager.getInstance().getValidQueryData<CaseDbConceptSet[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.CONCEPT_SETS)) ?? null;
    let concepts = QueryManager.getInstance().getValidQueryData<CaseDbConcept[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.CONCEPTS)) ?? null;

    if (conceptSets !== null && concepts !== null) {
      return;
    }

    if (conceptSets === null) {
      conceptSets = (await CaseDbOntologyApi.getInstance().conceptSetsGetAll({ signal })).data;
      queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.CONCEPT_SETS), conceptSets);
    }

    if (concepts === null) {
      concepts = (await CaseDbOntologyApi.getInstance().conceptsGetAll({ signal })).data;
      queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.CONCEPTS), concepts);
    }

    // Rebuild the cache
    this.data.conceptSets = {};
    this.data.conceptsBySetId = {};
    this.data.conceptsIdsBySetId = {};
    this.data.conceptsById = {};

    conceptSets.forEach(conceptSet => {
      this.data.conceptSets[conceptSet.id] = conceptSet;
      if (!this.data.conceptsBySetId[conceptSet.id]) {
        this.data.conceptsBySetId[conceptSet.id] = [];
        this.data.conceptsIdsBySetId[conceptSet.id] = [];
      }
    });

    concepts.forEach(concept => {
      this.data.conceptsById[concept.id] = concept;
      this.data.conceptsBySetId[concept.concept_set_id].push(concept);
      this.data.conceptsIdsBySetId[concept.concept_set_id].push(concept.id);
    });
  }

  public async loadMissingRegions(completeCaseType: CaseDbCompleteCaseType, signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.getInstance().queryClient;

    const regionSetIds = this.getMissingRegionSetIds(completeCaseType);
    if (!regionSetIds.length) {
      return;
    }

    const currentRegionSets = QueryManager.getInstance().getValidQueryData<CaseDbRegionSet[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? [];
    const currentRegions = QueryManager.getInstance().getValidQueryData<CaseDbRegion[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.REGIONS_LAZY)) ?? [];

    const regionSetsResult = (await CaseDbGeoApi.getInstance().regionSetsPostQuery({
      invert: false,
      key: 'id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, { signal })).data;
    const regionSets = [...regionSetsResult, ...currentRegionSets];
    queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.REGION_SETS_LAZY), regionSets);

    const regionsResult = (await CaseDbGeoApi.getInstance().regionsPostQuery({
      invert: false,
      key: 'region_set_id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, { signal })).data;
    const regions = [...regionsResult, ...currentRegions];
    queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.REGIONS_LAZY), regions);

    // Rebuild the cache
    this.data.regionSets = {};
    this.data.regionsByRegionSetId = {};
    this.data.regionsById = {};

    regionSets.forEach(regionSet => {
      this.data.regionSets[regionSet.id] = regionSet;
    });

    regions.forEach(region => {
      if (!this.data.regionsByRegionSetId[region.region_set_id]) {
        this.data.regionsByRegionSetId[region.region_set_id] = [];
      }
      this.data.regionsByRegionSetId[region.region_set_id].push(region);
      this.data.regionsById[region.id] = region;
    });
  }

  public async loadOrganizations(signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.getInstance().queryClient;

    let organizations = QueryManager.getInstance().getValidQueryData<CaseDbOrganization[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.ORGANIZATIONS)) ?? null;

    if (organizations !== null) {
      return;
    }
    organizations = (await CaseDbOrganizationApi.getInstance().organizationsGetAll({ signal })).data;
    queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.ORGANIZATIONS), organizations);

    // Rebuild the cache
    this.data.organizationsById = {};
    this.data.organizations = organizations;
    organizations.forEach(organization => {
      this.data.organizationsById[organization.id] = organization;
    });
  }

  public async loadTreeAlgorithms(completeCaseType: CaseDbCompleteCaseType, signal: AbortSignal): Promise<void> {
    if (!completeCaseType.tree_algorithms) {
      return;
    }
    const { queryClient } = QueryClientManager.getInstance();
    const queryKey = QueryManager.getInstance().getGenericKey(QUERY_KEY.TREE_ALGORITHMS);

    const currentTreeAlgorithms = QueryManager.getInstance().getValidQueryData<CaseDbTreeAlgorithm[]>(queryKey);
    if (currentTreeAlgorithms) {
      return;
    }
    const treeAlgorithms = (await CaseDbCaseApi.getInstance().treeAlgorithmsGetAll({ signal })).data.sort((a, b) => {
      if (a.rank === b.rank) {
        return a.name.localeCompare(b.name);
      }
      return a.rank - b.rank;
    });
    queryClient.setQueryData(queryKey, treeAlgorithms);
    this.data.treeAlgorithms = treeAlgorithms;
  }

  private getMissingRegionSetIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const regionSetIds = this.getRegionSetIds(completeCaseType);
    const currentRegionSetsIds = (QueryManager.getInstance().getValidQueryData<CaseDbRegionSet[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? []).map(x => x.id);
    return regionSetIds.filter(regionSetId => !currentRegionSetsIds.includes(regionSetId));
  }

}
