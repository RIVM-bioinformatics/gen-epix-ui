import difference from 'lodash/difference';
import uniq from 'lodash/uniq';

import type {
  CompleteCaseType,
  TreeAlgorithm,
  RegionSet,
  Region,
  ConceptSet,
  ConceptSetMember,
  Concept,
  Case,
  Organization,
} from '../../api';
import {
  CaseApi,
  GeoApi,
  OntologyApi,
  OrganizationApi,
  DimType,
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
    const treeAlgorithms = (await CaseApi.getInstance().treeAlgorithmsGetAll({ signal })).data.sort((a, b) => {
      if (a.rank === b.rank) {
        return a.name.localeCompare(b.name);
      }
      return a.rank - b.rank;
    });
    queryClient.setQueryData(queryKey, treeAlgorithms);
    EpiDataUtil.data.treeAlgorithms = treeAlgorithms;
  }

  public static async loadMissingRegionSets(completeCaseType: CompleteCaseType, signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    const regionSetIds = EpiDataUtil.getMissingRegionSetIds(completeCaseType);
    if (!regionSetIds.length) {
      return;
    }

    const currentRegionSets = QueryUtil.getValidQueryData<RegionSet[]>(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? [];
    const currentRegions = QueryUtil.getValidQueryData<Region[]>(QueryUtil.getGenericKey(QUERY_KEY.REGIONS_LAZY)) ?? [];

    const regionSetsResult = (await GeoApi.getInstance().regionSetsPostQuery({
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: regionSetIds,
    }, { signal })).data;
    const regionSets = [...regionSetsResult, ...currentRegionSets];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY), regionSets);

    const regionsResult = (await GeoApi.getInstance().regionsPostQuery({
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

  public static async loadMissingConceptSets(completeCaseType: CompleteCaseType, signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    const missingConceptSetIds = EpiDataUtil.getMissingConceptSetIds(completeCaseType);
    if (!missingConceptSetIds.length) {
      return;
    }

    const currentConceptSets = QueryUtil.getValidQueryData<ConceptSet[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS_LAZY)) ?? [];
    const currentConceptSetMembers = QueryUtil.getValidQueryData<ConceptSetMember[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SET_MEMBERS_LAZY)) ?? [];
    const currentConcepts = QueryUtil.getValidQueryData<Concept[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS_LAZY)) ?? [];

    const conceptSetsResult = (await OntologyApi.getInstance().conceptSetsPostQuery({
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: missingConceptSetIds,
    }, { signal })).data;
    const conceptSets = [...conceptSetsResult, ...currentConceptSets];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS_LAZY), conceptSets);

    const conceptSetMembersResult = (await OntologyApi.getInstance().conceptSetMembersPostQuery({
      invert: false,
      key: 'concept_set_id',
      type: 'UUID_SET',
      members: missingConceptSetIds,
    }, { signal })).data;
    const conceptSetMembers = [...conceptSetMembersResult, ...currentConceptSetMembers];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SET_MEMBERS_LAZY), conceptSetMembers);

    const missingConceptIds = difference(uniq(conceptSetMembers.map(x => x.concept_id)), currentConcepts.map(x => x.id));

    const conceptsResult = (await OntologyApi.getInstance().conceptsPostQuery({
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: missingConceptIds,
    }, { signal })).data;
    const concepts = [...conceptsResult, ...currentConcepts];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS_LAZY), concepts);

    // Rebuild the cache
    EpiDataUtil.data.conceptSets = {};
    EpiDataUtil.data.conceptsBySetId = {};
    EpiDataUtil.data.conceptsIdsBySetId = {};
    EpiDataUtil.data.conceptsById = {};

    conceptSets.forEach(conceptSet => {
      if (conceptSet) {
        EpiDataUtil.data.conceptSets[conceptSet.id] = conceptSet;
      }
    });

    concepts.forEach(concept => {
      EpiDataUtil.data.conceptsById[concept.id] = concept;
    });

    conceptSetMembers.forEach(conceptSetMember => {
      const concept = EpiDataUtil.data.conceptsById[conceptSetMember.concept_id];
      if (!concept) {
        throw Error('Concept not found');
      }
      if (!EpiDataUtil.data.conceptsBySetId[conceptSetMember.concept_set_id]) {
        EpiDataUtil.data.conceptsBySetId[conceptSetMember.concept_set_id] = [];
      }
      if (!EpiDataUtil.data.conceptsIdsBySetId[conceptSetMember.concept_set_id]) {
        EpiDataUtil.data.conceptsIdsBySetId[conceptSetMember.concept_set_id] = [];
      }
      EpiDataUtil.data.conceptsBySetId[conceptSetMember.concept_set_id].push(concept);
      EpiDataUtil.data.conceptsIdsBySetId[conceptSetMember.concept_set_id].push(concept.id);
      EpiDataUtil.data.conceptsById[concept.id] = concept;
    });
  }

  public static async loadMissingOrganizations(completeCaseType: CompleteCaseType, cases: Case[], signal: AbortSignal): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;

    const missingOrganizationIds = EpiDataUtil.getMissingOrganizationIds(completeCaseType, cases);
    if (!missingOrganizationIds.length) {
      return;
    }

    const currentOrganizations = QueryUtil.getValidQueryData<Organization[]>(QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS_LAZY)) ?? [];
    const loadedOrganizations = (await OrganizationApi.getInstance().organizationsPostQuery({
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: missingOrganizationIds,
    }, { signal })).data;
    const organizations = [...loadedOrganizations, ...currentOrganizations];
    queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS_LAZY), organizations);
    // Rebuild the cache
    EpiDataUtil.data.organizationsById = {};
    EpiDataUtil.data.organizations = organizations;
    organizations.forEach(organization => {
      EpiDataUtil.data.organizationsById[organization.id] = organization;
    });
  }

  public static getRegionSetIds(completeCaseType: CompleteCaseType): string[] {
    const regionSetIds: string[] = [];
    const caseTypeColumns = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType);
    caseTypeColumns.forEach(caseTypeColumn => {
      const column = completeCaseType.cols[caseTypeColumn.col_id];
      if (column.region_set_id && !regionSetIds.includes(column.region_set_id)) {
        regionSetIds.push(column.region_set_id);
      }
    });
    return regionSetIds;
  }

  private static getMissingOrganizationIds(completeCaseType: CompleteCaseType, cases: Case[]): string[] {
    const organizationColumnIds: string[] = [];
    completeCaseType.case_type_dims.forEach(caseTypeDimension => {
      const dimension = completeCaseType.dims[caseTypeDimension.dim_id];
      if (dimension.dim_type === DimType.ORGANIZATION) {
        organizationColumnIds.push(...caseTypeDimension.case_type_col_order);
      }
    });
    const organizationIds: string[] = [];
    cases.forEach(c => {
      organizationColumnIds.forEach(organizationColumnId => {
        const organizationId = c.content[organizationColumnId];
        if (organizationId && !organizationIds.includes(organizationId)) {
          organizationIds.push(organizationId);
        }
      });
    });

    const currentOrganizationIds = (QueryUtil.getValidQueryData<Organization[]>(QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS_LAZY)) ?? []).map(x => x.id);
    return organizationIds.filter(organizationId => !currentOrganizationIds.includes(organizationId));
  }

  private static getMissingRegionSetIds(completeCaseType: CompleteCaseType): string[] {
    const regionSetIds = EpiDataUtil.getRegionSetIds(completeCaseType);
    const currentRegionSetsIds = (QueryUtil.getValidQueryData<RegionSet[]>(QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS_LAZY)) ?? []).map(x => x.id);
    return regionSetIds.filter(regionSetId => !currentRegionSetsIds.includes(regionSetId));
  }

  private static getMissingConceptSetIds(completeCaseType: CompleteCaseType): string[] {
    const conceptSetIds: string[] = [];
    EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).forEach(caseTypeColumn => {
      const column = completeCaseType.cols[caseTypeColumn.col_id];
      if (column.concept_set_id && !conceptSetIds.includes(column.concept_set_id)) {
        conceptSetIds.push(column.concept_set_id);
      }
    });

    const currentConceptSetIds = (QueryUtil.getValidQueryData<ConceptSet[]>(QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS_LAZY)) ?? []).map(x => x.id);
    return conceptSetIds.filter(conceptId => !currentConceptSetIds.includes(conceptId));
  }
}
