import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import type {
  CaseTypeColSet,
  CaseTypeColSetMember,
  CaseTypeSetMember,
  OrganizationAccessCasePolicy,
  OrganizationShareCasePolicy,
  User,
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '../../api';
import { OrganizationApi } from '../../api';
import { useArray } from '../../hooks/useArray';
import { useItemQuery } from '../../hooks/useItemQuery';
import type { UserEffectiveRight } from '../../models/caseAccess';
import { QUERY_KEY } from '../../models/query';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';
import { useCaseTypeColSetMembersQuery } from '../useCaseTypeColSetMembersQuery';
import { useCaseTypeColSetsMapQuery } from '../useCaseTypeColSetsQuery';
import { useCaseTypeSetMembersQuery } from '../useCaseTypeSetMembersQuery';
import {
  useCaseTypeSetsMapQuery,
  useCaseTypeSetNameFactory,
} from '../useCaseTypeSetsQuery';
import {
  useDataCollectionsMapQuery,
  useDataCollectionOptionsQuery,
} from '../useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../useOrganizationShareCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../useUserAccessCasePoliciesQuery';
import { useUserShareCasePoliciesQuery } from '../useUserShareCasePoliciesQuery';
import type { UseMap } from '../../models/dataHooks';

export type UserEffectiveRightsQueryResult = {
  effectiveRights: UserEffectiveRight[];
  user: User;
  organizationAccessCasePolicies: OrganizationAccessCasePolicy[];
  organizationShareCasePolicies: OrganizationShareCasePolicy[];
  userAccessCasePolicies: UserAccessCasePolicy[];
  userShareCasePolicies: UserShareCasePolicy[];
  caseTypeSetMembers: CaseTypeSetMember[];
  caseTypeColSetMembers: CaseTypeColSetMember[];
  caseTypeColSetsMap: UseMap<CaseTypeColSet>['map'];
};


export const useUserEffectiveRightsQuery = (userId: string): Partial<UseQueryResult<UserEffectiveRightsQueryResult>> => {
  const userQuery = useItemQuery<User>({
    baseQueryKey: QUERY_KEY.USERS,
    itemId: userId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await OrganizationApi.instance.usersGetOne(userId, { signal });
        return response.data;
      },
    },
  });

  const { data: user } = userQuery;

  const caseTypeColSetMembersQuery = useCaseTypeColSetMembersQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();
  const caseTypeColSetsMapQuery = useCaseTypeColSetsMapQuery();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();
  const dataCollectionMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const organizationShareCasePoliciesQuery = useOrganizationShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const userAccessCasePoliciesQuery = useUserAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));
  const userShareCasePoliciesQuery = useUserShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));

  const loadables = useArray([
    userQuery,
    organizationAccessCasePoliciesQuery,
    organizationShareCasePoliciesQuery,
    userAccessCasePoliciesQuery,
    userShareCasePoliciesQuery,
    caseTypeSetMembersQuery,
    caseTypeColSetMembersQuery,
    dataCollectionMapQuery,
    dataCollectionOptionsQuery,
    caseTypeColSetsMapQuery,
    caseTypeSetNameFactory,
    caseTypeSetsMapQuery,
  ]);


  const effectiveRights = useMemo<UserEffectiveRight[]>(() => {

    return EffectiveRightsUtil.assembleUserEffectiveRights({
      user,
      organizationAccessCasePolicies: organizationAccessCasePoliciesQuery.data || [],
      organizationShareCasePolicies: organizationShareCasePoliciesQuery.data || [],
      userAccessCasePolicies: userAccessCasePoliciesQuery.data || [],
      userShareCasePolicies: userShareCasePoliciesQuery.data || [],
      caseTypeSetMembers: caseTypeSetMembersQuery.data || [],
      caseTypeColSetMembers: caseTypeColSetMembersQuery.data || [],
    });

  }, [caseTypeColSetMembersQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, organizationShareCasePoliciesQuery, user, userAccessCasePoliciesQuery, userShareCasePoliciesQuery]);

  const result = useMemo(() => {
    return {
      loading: loadables.some(x => x.isLoading),
      error: (loadables.find(x => x.error)?.error ?? null) as Error,
      data: {
        effectiveRights,
        user,
        organizationAccessCasePolicies: organizationAccessCasePoliciesQuery.data,
        organizationShareCasePolicies: organizationShareCasePoliciesQuery.data,
        userAccessCasePolicies: userAccessCasePoliciesQuery.data,
        userShareCasePolicies: userShareCasePoliciesQuery.data,
        caseTypeSetMembers: caseTypeSetMembersQuery.data,
        caseTypeColSetMembers: caseTypeColSetMembersQuery.data,
        caseTypeColSetsMap: caseTypeColSetsMapQuery.map,
      },
    };
  }, [caseTypeColSetMembersQuery.data, caseTypeColSetsMapQuery.map, caseTypeSetMembersQuery.data, effectiveRights, loadables, organizationAccessCasePoliciesQuery.data, organizationShareCasePoliciesQuery.data, user, userAccessCasePoliciesQuery.data, userShareCasePoliciesQuery.data]);

  return result;
};
