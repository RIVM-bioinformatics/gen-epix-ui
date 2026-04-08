import type {
  User,
  ColSetMember,
  CaseTypeSetMember,
  OrganizationAccessCasePolicy,
  OrganizationShareCasePolicy,
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '../../api';
import type { UserEffectiveRight } from '../../models/caseAccess';
import { DataSetUtil } from '../DataSetUtil';

type AssembleUserEffectiveRightsKwArgs = {
  user: User;
  organizationAccessCasePolicies: OrganizationAccessCasePolicy[];
  organizationShareCasePolicies: OrganizationShareCasePolicy[];
  userAccessCasePolicies: UserAccessCasePolicy[];
  userShareCasePolicies: UserShareCasePolicy[];
  caseTypeSetMembers: CaseTypeSetMember[];
  colSetMembers: ColSetMember[];
};

type GetOrganizationPolicyGroupsKwArgs = Pick<AssembleUserEffectiveRightsKwArgs, 'organizationAccessCasePolicies' | 'organizationShareCasePolicies'>;

export type OrganizationPolicyGroup = {
  organization_id: string;
  data_collection_id: string;
  access_case_policies: OrganizationAccessCasePolicy[];
  share_case_policies: OrganizationShareCasePolicy[];
};

export class EffectiveRightsUtil {
  public static getMatchingOrganizationShareCasePolicies(params: {
    organizationId: string;
    dataCollectionId: string;
    organizationShareCasePolicies: OrganizationShareCasePolicy[];
  }): OrganizationShareCasePolicy[] {
    const {
      organizationId,
      dataCollectionId,
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

    const sharePoliciesByKey = new Map<string, OrganizationShareCasePolicy[]>();

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
          organization_id: policy.organization_id,
          data_collection_id: policy.data_collection_id,
          access_case_policies: [policy],
          share_case_policies: sharePoliciesByKey.get(key) ?? [],
        });
      });

    return Array.from(groups.values());
  }

  public static assembleUserEffectiveRights({
    user,
    organizationAccessCasePolicies,
    organizationShareCasePolicies,
    userAccessCasePolicies,
    userShareCasePolicies,
    caseTypeSetMembers,
    colSetMembers,
  }: AssembleUserEffectiveRightsKwArgs): UserEffectiveRight[] {
    if (!user) {
      return [];
    }

    if (!organizationAccessCasePolicies || !organizationShareCasePolicies || !userAccessCasePolicies || !userShareCasePolicies || !caseTypeSetMembers || !colSetMembers) {
      return [];
    }

    const mappedCaseTypeSetMembers = DataSetUtil.getMappedSetMembers({
      items: caseTypeSetMembers,
      setProperty: 'case_type_set_id',
      memberProperty: 'case_type_id',
    });

    const mappedColSetMembers = DataSetUtil.getMappedSetMembers({
      items: colSetMembers,
      setProperty: 'col_set_id',
      memberProperty: 'col_id',
    });

    return organizationAccessCasePolicies.map(organizationPolicy => {
      const userPolicy = userAccessCasePolicies.find(p => p.data_collection_id === organizationPolicy.data_collection_id);
      const organizationSharePolicy = EffectiveRightsUtil.getMatchingOrganizationShareCasePolicies({
        organizationId: organizationPolicy.organization_id,
        dataCollectionId: organizationPolicy.data_collection_id,
        organizationShareCasePolicies,
      });
      const userSharePolicy = userShareCasePolicies.filter(p => p.data_collection_id === organizationPolicy.data_collection_id);

      const effectiveShareCaseRights: UserEffectiveRight['effective_share_case_rights'] = [];
      organizationSharePolicy.forEach(organizationShareCasePolicy => {
        const userShareCasePolicy = userSharePolicy.find(p => p.from_data_collection_id === organizationShareCasePolicy.from_data_collection_id);
        const organizationShareCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === organizationShareCasePolicy.case_type_set_id).map(member => member.case_type_id);
        const userShareCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === userShareCasePolicy?.case_type_set_id).map(member => member.case_type_id);
        const { setIds: case_type_set_ids, categorizedMemberIds: categorized_case_type_ids, uncategorizedMemberIds: uncategorized_case_type_ids } = DataSetUtil.getCategorizedSetMembers({
          mappedSetMembers: mappedCaseTypeSetMembers,
          parentSetId: organizationShareCasePolicy.case_type_set_id,
          parentMemberIds: organizationShareCaseTypeIds,
          childMemberIds: userShareCaseTypeIds,
        });

        const add_case = organizationShareCasePolicy.add_case && userShareCasePolicy?.add_case;
        const remove_case = organizationShareCasePolicy.remove_case && userShareCasePolicy?.remove_case;
        const add_case_set = organizationShareCasePolicy.add_case_set && userShareCasePolicy?.add_case_set;
        const remove_case_set = organizationShareCasePolicy.remove_case_set && userShareCasePolicy?.remove_case_set;

        if ([add_case, remove_case, add_case_set, remove_case_set].some(x => x)) {
          effectiveShareCaseRights.push({
            add_case,
            remove_case,
            add_case_set,
            remove_case_set,
            from_data_collection_id: organizationShareCasePolicy.from_data_collection_id,
            case_type_set_ids,
            categorized_case_type_ids,
            uncategorized_case_type_ids,
          } satisfies UserEffectiveRight['effective_share_case_rights'][number]);
        }
      });


      const organizationCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === organizationPolicy.case_type_set_id).map(member => member.case_type_id);
      const userCaseTypeIds = caseTypeSetMembers.filter(member => member.case_type_set_id === userPolicy?.case_type_set_id).map(member => member.case_type_id);
      const { setIds: case_type_set_ids, categorizedMemberIds: categorized_case_type_ids, uncategorizedMemberIds: uncategorized_case_type_ids } = DataSetUtil.getCategorizedSetMembers({
        mappedSetMembers: mappedCaseTypeSetMembers,
        parentSetId: organizationPolicy.case_type_set_id,
        parentMemberIds: organizationCaseTypeIds,
        childMemberIds: userCaseTypeIds,
      });

      const organizationReadColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.read_col_set_id).map(member => member.col_id);
      const userReadColIds = colSetMembers.filter(member => member.col_set_id === userPolicy?.read_col_set_id).map(member => member.col_id);
      const { setIds: read_col_set_ids, categorizedMemberIds: categorized_read_col_ids, uncategorizedMemberIds: uncategorized_read_col_ids } = DataSetUtil.getCategorizedSetMembers({
        mappedSetMembers: mappedColSetMembers,
        parentSetId: organizationPolicy.read_col_set_id,
        parentMemberIds: organizationReadColIds,
        childMemberIds: userReadColIds,
      });

      const organizationWriteColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.write_col_set_id).map(member => member.col_id);
      const userWriteColIds = colSetMembers.filter(member => member.col_set_id === userPolicy?.write_col_set_id).map(member => member.col_id);
      const { setIds: write_col_set_ids, categorizedMemberIds: categorized_write_col_ids, uncategorizedMemberIds: uncategorized_write_col_ids } = DataSetUtil.getCategorizedSetMembers({
        mappedSetMembers: mappedColSetMembers,
        parentSetId: organizationPolicy.write_col_set_id,
        parentMemberIds: organizationWriteColIds,
        childMemberIds: userWriteColIds,
      });

      return {
        add_case: organizationPolicy.add_case && userPolicy?.add_case,
        add_case_set: organizationPolicy.add_case_set && userPolicy?.add_case_set,
        data_collection_id: organizationPolicy.data_collection_id,
        is_private: organizationPolicy.is_private,
        organization_id: organizationPolicy.organization_id,
        read_case_set: organizationPolicy.read_case_set && userPolicy?.read_case_set,
        remove_case: organizationPolicy.remove_case && userPolicy?.remove_case,
        remove_case_set: organizationPolicy.remove_case_set && userPolicy?.remove_case_set,
        write_case_set: organizationPolicy.write_case_set && userPolicy?.write_case_set,
        write_col_set_id: organizationPolicy.write_col_set_id,
        read_col_set_id: organizationPolicy.read_col_set_id,
        case_type_set_ids,
        categorized_case_type_ids,
        uncategorized_case_type_ids,
        read_col_set_ids,
        categorized_read_col_ids,
        uncategorized_read_col_ids,
        write_col_set_ids,
        categorized_write_col_ids,
        uncategorized_write_col_ids,
        effective_share_case_rights: effectiveShareCaseRights,
      } satisfies UserEffectiveRight;
    }).filter((policy => !!policy));
  }

  private static getOrganizationDataCollectionKey(organizationId: string, dataCollectionId: string) {
    return `${organizationId}::${dataCollectionId}`;
  }
}
