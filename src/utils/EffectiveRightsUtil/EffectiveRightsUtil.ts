import type {
  User,
  CaseTypeColSetMember,
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
  caseTypeColSetMembers: CaseTypeColSetMember[];
};

export class EffectiveRightsUtil {
  public static assembleUserEffectiveRights({
    user,
    organizationAccessCasePolicies,
    organizationShareCasePolicies,
    userAccessCasePolicies,
    userShareCasePolicies,
    caseTypeSetMembers,
    caseTypeColSetMembers,
  }: AssembleUserEffectiveRightsKwArgs): UserEffectiveRight[] {
    if (!user) {
      return [];
    }

    if (!organizationAccessCasePolicies || !organizationShareCasePolicies || !userAccessCasePolicies || !userShareCasePolicies || !caseTypeSetMembers || !caseTypeColSetMembers) {
      return [];
    }

    const mappedCaseTypeSetMembers = DataSetUtil.getMappedSetMembers({
      items: caseTypeSetMembers,
      setProperty: 'case_type_set_id',
      memberProperty: 'case_type_id',
    });

    const mappedCaseTypeColSetMembers = DataSetUtil.getMappedSetMembers({
      items: caseTypeColSetMembers,
      setProperty: 'case_type_col_set_id',
      memberProperty: 'case_type_col_id',
    });

    return organizationAccessCasePolicies.map(organizationPolicy => {
      const userPolicy = userAccessCasePolicies.find(p => p.data_collection_id === organizationPolicy.data_collection_id);
      const organizationSharePolicy = organizationShareCasePolicies.filter(p => p.data_collection_id === organizationPolicy.data_collection_id);
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

      const organizationReadCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === organizationPolicy.read_case_type_col_set_id).map(member => member.case_type_col_id);
      const userReadCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === userPolicy?.read_case_type_col_set_id).map(member => member.case_type_col_id);
      const { setIds: read_case_type_col_set_ids, categorizedMemberIds: categorized_read_case_type_col_ids, uncategorizedMemberIds: uncategorized_read_case_type_col_ids } = DataSetUtil.getCategorizedSetMembers({
        mappedSetMembers: mappedCaseTypeColSetMembers,
        parentSetId: organizationPolicy.read_case_type_col_set_id,
        parentMemberIds: organizationReadCaseTypeColIds,
        childMemberIds: userReadCaseTypeColIds,
      });

      const organizationWriteCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === organizationPolicy.write_case_type_col_set_id).map(member => member.case_type_col_id);
      const userWriteCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === userPolicy?.write_case_type_col_set_id).map(member => member.case_type_col_id);
      const { setIds: write_case_type_col_set_ids, categorizedMemberIds: categorized_write_case_type_col_ids, uncategorizedMemberIds: uncategorized_write_case_type_col_ids } = DataSetUtil.getCategorizedSetMembers({
        mappedSetMembers: mappedCaseTypeColSetMembers,
        parentSetId: organizationPolicy.write_case_type_col_set_id,
        parentMemberIds: organizationWriteCaseTypeColIds,
        childMemberIds: userWriteCaseTypeColIds,
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
        write_case_type_col_set_id: organizationPolicy.write_case_type_col_set_id,
        read_case_type_col_set_id: organizationPolicy.read_case_type_col_set_id,
        case_type_set_ids,
        categorized_case_type_ids,
        uncategorized_case_type_ids,
        read_case_type_col_set_ids,
        categorized_read_case_type_col_ids,
        uncategorized_read_case_type_col_ids,
        write_case_type_col_set_ids,
        categorized_write_case_type_col_ids,
        uncategorized_write_case_type_col_ids,
        effective_share_case_rights: effectiveShareCaseRights,
      } satisfies UserEffectiveRight;
    }).filter((policy => !!policy));
  }
}
