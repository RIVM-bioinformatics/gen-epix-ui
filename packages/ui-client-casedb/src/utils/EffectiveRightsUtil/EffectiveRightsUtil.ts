import type {
  CaseDbCaseTypeSetMember,
  CaseDbColSetMember,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';

import type { UserEffectiveRight } from '../../models/caseAccess';
import { DataSetUtil } from '../DataSetUtil';

export type OrganizationPolicyGroup = {
  access_case_policies: CaseDbOrganizationAccessCasePolicy[];
  data_collection_id: string;
  organization_id: string;
  share_case_policies: CaseDbOrganizationShareCasePolicy[];
};

type AssembleUserEffectiveRightsKwArgs = {
  caseTypeSetMembers: CaseDbCaseTypeSetMember[];
  colSetMembers: CaseDbColSetMember[];
  organizationAccessCasePolicies: CaseDbOrganizationAccessCasePolicy[];
  organizationShareCasePolicies: CaseDbOrganizationShareCasePolicy[];
  user: CaseDbUser;
  userAccessCasePolicies: CaseDbUserAccessCasePolicy[];
  userShareCasePolicies: CaseDbUserShareCasePolicy[];
};

type GetOrganizationPolicyGroupsKwArgs = Pick<AssembleUserEffectiveRightsKwArgs, 'organizationAccessCasePolicies' | 'organizationShareCasePolicies'>;

export class EffectiveRightsUtil {
  public static assembleUserEffectiveRights({
    caseTypeSetMembers,
    colSetMembers,
    organizationAccessCasePolicies,
    organizationShareCasePolicies,
    user,
    userAccessCasePolicies,
    userShareCasePolicies,
  }: AssembleUserEffectiveRightsKwArgs): UserEffectiveRight[] {
    if (!user) {
      return [];
    }

    if (!organizationAccessCasePolicies || !organizationShareCasePolicies || !userAccessCasePolicies || !userShareCasePolicies || !caseTypeSetMembers || !colSetMembers) {
      return [];
    }

    const mappedCaseTypeSetMembers = DataSetUtil.getMappedSetMembers({
      items: caseTypeSetMembers,
      memberProperty: 'case_type_id',
      setProperty: 'case_type_set_id',
    });

    const mappedColSetMembers = DataSetUtil.getMappedSetMembers({
      items: colSetMembers,
      memberProperty: 'col_id',
      setProperty: 'col_set_id',
    });

    return organizationAccessCasePolicies.map(organizationPolicy => {
      const userPolicy = userAccessCasePolicies.find(p => p.data_collection_id === organizationPolicy.data_collection_id);
      const organizationSharePolicy = EffectiveRightsUtil.getMatchingOrganizationShareCasePolicies({
        dataCollectionId: organizationPolicy.data_collection_id,
        organizationId: organizationPolicy.organization_id,
        organizationShareCasePolicies,
      });
      const userSharePolicy = userShareCasePolicies.filter(p => p.data_collection_id === organizationPolicy.data_collection_id);

      const effectiveShareCaseRights: UserEffectiveRight['effective_share_case_rights'] = [];
      organizationSharePolicy.forEach(organizationShareCasePolicy => {
        const userShareCasePolicy = userSharePolicy.find(p => p.from_data_collection_id === organizationShareCasePolicy.from_data_collection_id);
        const organizationShareCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === organizationShareCasePolicy.case_type_set_id).map(member => member.case_type_id);
        const userShareCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === userShareCasePolicy?.case_type_set_id).map(member => member.case_type_id);
        const { categorizedMemberIds: categorized_case_type_ids, setIds: case_type_set_ids, uncategorizedMemberIds: uncategorized_case_type_ids } = DataSetUtil.getCategorizedSetMembers({
          childMemberIds: userShareCaseTypeIds,
          mappedSetMembers: mappedCaseTypeSetMembers,
          parentMemberIds: organizationShareCaseTypeIds,
          parentSetId: organizationShareCasePolicy.case_type_set_id,
        });

        const add_case = organizationShareCasePolicy.add_case && userShareCasePolicy?.add_case;
        const remove_case = organizationShareCasePolicy.remove_case && userShareCasePolicy?.remove_case;
        const add_case_set = organizationShareCasePolicy.add_case_set && userShareCasePolicy?.add_case_set;
        const remove_case_set = organizationShareCasePolicy.remove_case_set && userShareCasePolicy?.remove_case_set;

        if ([add_case, remove_case, add_case_set, remove_case_set].some(x => x)) {
          effectiveShareCaseRights.push({
            add_case,
            add_case_set,
            case_type_set_ids,
            categorized_case_type_ids,
            from_data_collection_id: organizationShareCasePolicy.from_data_collection_id,
            remove_case,
            remove_case_set,
            uncategorized_case_type_ids,
          } satisfies UserEffectiveRight['effective_share_case_rights'][number]);
        }
      });


      const organizationCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === organizationPolicy.case_type_set_id).map(member => member.case_type_id);
      const userCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === userPolicy?.case_type_set_id).map(member => member.case_type_id);
      const { categorizedMemberIds: categorized_case_type_ids, setIds: case_type_set_ids, uncategorizedMemberIds: uncategorized_case_type_ids } = DataSetUtil.getCategorizedSetMembers({
        childMemberIds: userCaseTypeIds,
        mappedSetMembers: mappedCaseTypeSetMembers,
        parentMemberIds: organizationCaseTypeIds,
        parentSetId: organizationPolicy.case_type_set_id,
      });

      const organizationReadColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.read_col_set_id).map(member => member.col_id);
      const userReadColIds = colSetMembers.filter(member => member.col_set_id === userPolicy?.read_col_set_id).map(member => member.col_id);
      const { categorizedMemberIds: categorized_read_col_ids, setIds: read_col_set_ids, uncategorizedMemberIds: uncategorized_read_col_ids } = DataSetUtil.getCategorizedSetMembers({
        childMemberIds: userReadColIds,
        mappedSetMembers: mappedColSetMembers,
        parentMemberIds: organizationReadColIds,
        parentSetId: organizationPolicy.read_col_set_id,
      });

      const organizationWriteColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.write_col_set_id).map(member => member.col_id);
      const userWriteColIds = colSetMembers.filter(member => member.col_set_id === userPolicy?.write_col_set_id).map(member => member.col_id);
      const { categorizedMemberIds: categorized_write_col_ids, setIds: write_col_set_ids, uncategorizedMemberIds: uncategorized_write_col_ids } = DataSetUtil.getCategorizedSetMembers({
        childMemberIds: userWriteColIds,
        mappedSetMembers: mappedColSetMembers,
        parentMemberIds: organizationWriteColIds,
        parentSetId: organizationPolicy.write_col_set_id,
      });

      return {
        add_case: organizationPolicy.add_case && userPolicy?.add_case,
        add_case_set: organizationPolicy.add_case_set && userPolicy?.add_case_set,
        case_type_set_ids,
        categorized_case_type_ids,
        categorized_read_col_ids,
        categorized_write_col_ids,
        data_collection_id: organizationPolicy.data_collection_id,
        effective_share_case_rights: effectiveShareCaseRights,
        is_private: organizationPolicy.is_private,
        organization_id: organizationPolicy.organization_id,
        read_case_set: organizationPolicy.read_case_set && userPolicy?.read_case_set,
        read_col_set_id: organizationPolicy.read_col_set_id,
        read_col_set_ids,
        remove_case: organizationPolicy.remove_case && userPolicy?.remove_case,
        remove_case_set: organizationPolicy.remove_case_set && userPolicy?.remove_case_set,
        uncategorized_case_type_ids,
        uncategorized_read_col_ids,
        uncategorized_write_col_ids,
        write_case_set: organizationPolicy.write_case_set && userPolicy?.write_case_set,
        write_col_set_id: organizationPolicy.write_col_set_id,
        write_col_set_ids,
      } satisfies UserEffectiveRight;
    }).filter((policy => !!policy));
  }

  public static getMatchingOrganizationShareCasePolicies(params: {
    dataCollectionId: string;
    organizationId: string;
    organizationShareCasePolicies: CaseDbOrganizationShareCasePolicy[];
  }): CaseDbOrganizationShareCasePolicy[] {
    const {
      dataCollectionId,
      organizationId,
      organizationShareCasePolicies,
    } = params;

    if (!organizationShareCasePolicies) {
      return [];
    }

    return organizationShareCasePolicies.filter(policy => policy.is_active && policy.organization_id === organizationId && policy.data_collection_id === dataCollectionId);
  }

  public static getOrganizationPolicyGroups({
    organizationAccessCasePolicies,
    organizationShareCasePolicies,
  }: GetOrganizationPolicyGroupsKwArgs): OrganizationPolicyGroup[] {
    if (!organizationAccessCasePolicies || !organizationShareCasePolicies) {
      return [];
    }

    const sharePoliciesByKey = new Map<string, CaseDbOrganizationShareCasePolicy[]>();

    organizationShareCasePolicies
      .filter(policy => policy.is_active)
      .forEach(policy => {
        const key = EffectiveRightsUtil.getOrganizationDataCollectionKey(policy.organization_id, policy.data_collection_id);
        const matchingPolicies = sharePoliciesByKey.get(key) ?? [];
        matchingPolicies.push(policy);
        sharePoliciesByKey.set(key, matchingPolicies);
      });

    const groups = new Map<string, OrganizationPolicyGroup>();

    organizationAccessCasePolicies
      .filter(policy => policy.is_active)
      .forEach(policy => {
        const key = EffectiveRightsUtil.getOrganizationDataCollectionKey(policy.organization_id, policy.data_collection_id);
        const existingGroup = groups.get(key);

        if (existingGroup) {
          existingGroup.access_case_policies.push(policy);
          return;
        }

        groups.set(key, {
          access_case_policies: [policy],
          data_collection_id: policy.data_collection_id,
          organization_id: policy.organization_id,
          share_case_policies: sharePoliciesByKey.get(key) ?? [],
        });
      });

    return Array.from(groups.values());
  }

  private static getOrganizationDataCollectionKey(organizationId: string, dataCollectionId: string) {
    return `${organizationId}::${dataCollectionId}`;
  }
}
