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
import { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  inject,
  singleton,
} from 'tsyringe';

import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CASEDB_QUERY_KEY } from '../../../constants/query.constants';
import type { DataCache } from '../../../models/case-db.models';

@singleton()
export class DataService {

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
  private readonly caseDbCaseApi: CaseDbCaseApi;
  private readonly caseDbGeoApi: CaseDbGeoApi;
  private readonly caseDbOntologyApi: CaseDbOntologyApi;
  private readonly caseDbOrganizationApi: CaseDbOrganizationApi;
  private readonly queryClientService: QueryClientService;

  public constructor(
    @inject(QueryClientService) queryClientService: QueryClientService,
    @inject(CaseDbCaseApi) caseDbCaseApi: CaseDbCaseApi,
    @inject(CaseDbGeoApi) caseDbGeoApi: CaseDbGeoApi,
    @inject(CaseDbOntologyApi) caseDbOntologyApi: CaseDbOntologyApi,
    @inject(CaseDbOrganizationApi) caseDbOrganizationApi: CaseDbOrganizationApi,
  ) {
    this.queryClientService = queryClientService;
    this.caseDbCaseApi = caseDbCaseApi;
    this.caseDbGeoApi = caseDbGeoApi;
    this.caseDbOntologyApi = caseDbOntologyApi;
    this.caseDbOrganizationApi = caseDbOrganizationApi;
  }


  public async loadConcepts(signal: AbortSignal): Promise<void> {
    const queryClient = this.queryClientService.queryClient;

    let conceptSets = this.queryClientService.getValidQueryData<CaseDbConceptSet[]>(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS)) ?? null;
    let concepts = this.queryClientService.getValidQueryData<CaseDbConcept[]>(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.CONCEPTS)) ?? null;

    if (conceptSets !== null && concepts !== null) {
      return;
    }

    if (conceptSets === null) {
      conceptSets = (await this.caseDbOntologyApi.conceptSetsGetAll(null, null, { signal })).data;
      queryClient.setQueryData(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS), conceptSets);
    }

    if (concepts === null) {
      concepts = (await this.caseDbOntologyApi.conceptsGetAll(null, null, { signal })).data;
      concepts.forEach(concept => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          concept.props = JSON.parse(concept.props as unknown as string);
        } catch (_e) {
          //
        }
      });
      queryClient.setQueryData(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.CONCEPTS), concepts);
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
    const queryClient = this.queryClientService.queryClient;

    const regionSetIds = this.getMissingRegionSetIds(completeCaseType);
    if (!regionSetIds.length) {
      return;
    }

    const currentRegionSets = this.queryClientService.getValidQueryData<CaseDbRegionSet[]>(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY)) ?? [];
    const currentRegions = this.queryClientService.getValidQueryData<CaseDbRegion[]>(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.REGIONS_LAZY)) ?? [];

    const regionSetsResult = (await this.caseDbGeoApi.regionSetsPostQuery({
      invert: false,
      key: 'id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, null, null, { signal })).data;
    const regionSets = [...regionSetsResult, ...currentRegionSets];
    queryClient.setQueryData(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY), regionSets);

    const regionsResult = (await this.caseDbGeoApi.regionsPostQuery({
      invert: false,
      key: 'region_set_id',
      members: regionSetIds,
      type: 'UUID_SET',
    }, null, null, { signal })).data;
    const regions = [...regionsResult, ...currentRegions];
    queryClient.setQueryData(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.REGIONS_LAZY), regions);

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
    const queryClient = this.queryClientService.queryClient;

    let organizations = this.queryClientService.getValidQueryData<CaseDbOrganization[]>(this.queryClientService.getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS)) ?? null;

    if (organizations !== null) {
      return;
    }
    organizations = (await this.caseDbOrganizationApi.organizationsGetAll(null, null, { signal })).data;
    queryClient.setQueryData(this.queryClientService.getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS), organizations);

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
    const { queryClient } = this.queryClientService;
    const queryKey = this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.TREE_ALGORITHMS);

    const currentTreeAlgorithms = this.queryClientService.getValidQueryData<CaseDbTreeAlgorithm[]>(queryKey);
    if (currentTreeAlgorithms) {
      return;
    }
    const treeAlgorithms = (await this.caseDbCaseApi.treeAlgorithmsGetAll(null, null, { signal })).data.sort((a, b) => {
      if (!a.rank && !b.rank) {
        return a.name.localeCompare(b.name);
      }
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      }
      return a.rank ? -1 : 1;
    });
    queryClient.setQueryData(queryKey, treeAlgorithms);
    this.data.treeAlgorithms = treeAlgorithms;
  }

  private getMissingRegionSetIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const regionSetIds = CaseTypeUtil.getRegionSetIds(completeCaseType);
    const currentRegionSetsIds = (this.queryClientService.getValidQueryData<CaseDbRegionSet[]>(this.queryClientService.getGenericKey(CASEDB_QUERY_KEY.REGION_SETS_LAZY)) ?? []).map(x => x.id);
    return regionSetIds.filter(regionSetId => !currentRegionSetsIds.includes(regionSetId));
  }

}
