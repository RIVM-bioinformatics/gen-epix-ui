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
  COMMON_QUERY_KEY,
  HmrUtil,
  QueryClientService,
} from '@gen-epix/ui';

import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import type { DataCache } from '../../../models/caseDb';

export class DataService {
  private static __instance: DataService;

  public readonly data: DataCache = {
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

  public static getInstance(): DataService {
    DataService.__instance = HmrUtil.getHmrSingleton('dataService', DataService.__instance, () => new DataService());
    return DataService.__instance;
  }

  public async loadConcepts(signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientService.getInstance().queryClient;

    let conceptSets = QueryClientService.getInstance().getValidQueryData<CaseDbConceptSet[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS)) ?? null;
    let concepts = QueryClientService.getInstance().getValidQueryData<CaseDbConcept[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPTS)) ?? null;

    if (conceptSets !== null && concepts !== null) {
      return;
    }

    if (conceptSets === null) {
      conceptSets = (await CaseDbOntologyApi.getInstance().conceptSetsGetAll(null, null, { signal })).data;
      queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS), conceptSets);
    }

    if (concepts === null) {
      concepts = (await CaseDbOntologyApi.getInstance().conceptsGetAll(null, null, { signal })).data;
      concepts.forEach(concept => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          concept.props = JSON.parse(concept.props as unknown as string);
        } catch (_e) {
          //
        }
      });
      queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPTS), concepts);
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
    const queryClient = QueryClientService.getInstance().queryClient;

    const regionSetIds = this.getMissingRegionSetIds(completeCaseType);
    if (!regionSetIds.length) {
      return;
    }

    const currentRegionSets = QueryClientService.getInstance().getValidQueryData<CaseDbRegionSet[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY)) ?? [];
    const currentRegions = QueryClientService.getInstance().getValidQueryData<CaseDbRegion[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGIONS_LAZY)) ?? [];

    const regionSetsResult = (await CaseDbGeoApi.getInstance().regionSetsPostQuery({
      invert: false,
      key: 'id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, null, null, { signal })).data;
    const regionSets = [...regionSetsResult, ...currentRegionSets];
    queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY), regionSets);

    const regionsResult = (await CaseDbGeoApi.getInstance().regionsPostQuery({
      invert: false,
      key: 'region_set_id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, null, null, { signal })).data;
    const regions = [...regionsResult, ...currentRegions];
    queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGIONS_LAZY), regions);

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
    const queryClient = QueryClientService.getInstance().queryClient;

    let organizations = QueryClientService.getInstance().getValidQueryData<CaseDbOrganization[]>(QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS)) ?? null;

    if (organizations !== null) {
      return;
    }
    organizations = (await CaseDbOrganizationApi.getInstance().organizationsGetAll(null, null, { signal })).data;
    queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS), organizations);

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
    const { queryClient } = QueryClientService.getInstance();
    const queryKey = QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.TREE_ALGORITHMS);

    const currentTreeAlgorithms = QueryClientService.getInstance().getValidQueryData<CaseDbTreeAlgorithm[]>(queryKey);
    if (currentTreeAlgorithms) {
      return;
    }
    const treeAlgorithms = (await CaseDbCaseApi.getInstance().treeAlgorithmsGetAll(null, null, { signal })).data.sort((a, b) => {
      if (a.rank === b.rank) {
        return a.name.localeCompare(b.name);
      }
      return a.rank - b.rank;
    });
    queryClient.setQueryData(queryKey, treeAlgorithms);
    this.data.treeAlgorithms = treeAlgorithms;
  }

  private getMissingRegionSetIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const regionSetIds = CaseTypeUtil.getRegionSetIds(completeCaseType);
    const currentRegionSetsIds = (QueryClientService.getInstance().getValidQueryData<CaseDbRegionSet[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY)) ?? []).map(x => x.id);
    return regionSetIds.filter(regionSetId => !currentRegionSetsIds.includes(regionSetId));
  }

}
