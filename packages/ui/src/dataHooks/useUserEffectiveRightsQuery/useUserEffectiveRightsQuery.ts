import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type {
  CaseTypeSetMember,
  ColSet,
  ColSetMember,
  OrganizationAccessCasePolicy,
  OrganizationShareCasePolicy,
  User,
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '@gen-epix/api-casedb';
import { OrganizationApi } from '@gen-epix/api-casedb';

import { useArray } from '../../hooks/useArray';
import { useItemQuery } from '../../hooks/useItemQuery';
import type { UserEffectiveRight } from '../../models/caseAccess';
import { QUERY_KEY } from '../../models/query';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';
import { useColSetMembersQuery } from '../useColSetMembersQuery';
import { useColSetMapQuery } from '../useColSetsQuery';
import { useCaseTypeSetMembersQuery } from '../useCaseTypeSetMembersQuery';
import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery,
} from '../useCaseTypeSetsQuery';
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
} from '../useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../useOrganizationShareCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../useUserAccessCasePoliciesQuery';
import { useUserShareCasePoliciesQuery } from '../useUserShareCasePoliciesQuery';
import type { UseMap } from '../../models/dataHooks';
import { LoadableUtil } from '../../utils/LoadableUtil';

export type UserEffectiveRightsQueryResult = {
  caseTypeSetMembers: CaseTypeSetMember[];
  colSetMembers: ColSetMember[];
  colSetsMap: UseMap<ColSet>['map'];
  effectiveRights: UserEffectiveRight[];
  organizationAccessCasePolicies: OrganizationAccessCasePolicy[];
  organizationShareCasePolicies: OrganizationShareCasePolicy[];
  user: User;
  userAccessCasePolicies: UserAccessCasePolicy[];
  userShareCasePolicies: UserShareCasePolicy[];
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

  const colSetMembersQuery = useColSetMembersQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();
  const colSetMapQuery = useColSetMapQuery();
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
    colSetMembersQuery,
    dataCollectionMapQuery,
    dataCollectionOptionsQuery,
    colSetMapQuery,
    caseTypeSetNameFactory,
    caseTypeSetsMapQuery,
  ]);


  const effectiveRights = useMemo<UserEffectiveRight[]>(() => {

    return EffectiveRightsUtil.assembleUserEffectiveRights({
      caseTypeSetMembers: caseTypeSetMembersQuery.data || [],
      colSetMembers: colSetMembersQuery.data || [],
      organizationAccessCasePolicies: organizationAccessCasePoliciesQuery.data || [],
      organizationShareCasePolicies: organizationShareCasePoliciesQuery.data || [],
      user,
      userAccessCasePolicies: userAccessCasePoliciesQuery.data || [],
      userShareCasePolicies: userShareCasePoliciesQuery.data || [],
    });

  }, [colSetMembersQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, organizationShareCasePoliciesQuery, user, userAccessCasePoliciesQuery, userShareCasePoliciesQuery]);

  const result = useMemo(() => {
    return {
      data: {
        caseTypeSetMembers: caseTypeSetMembersQuery.data,
        colSetMembers: colSetMembersQuery.data,
        colSetsMap: colSetMapQuery.map,
        effectiveRights,
        organizationAccessCasePolicies: organizationAccessCasePoliciesQuery.data,
        organizationShareCasePolicies: organizationShareCasePoliciesQuery.data,
        user,
        userAccessCasePolicies: userAccessCasePoliciesQuery.data,
        userShareCasePolicies: userShareCasePoliciesQuery.data,
      },
      error: (loadables.find(x => x.error)?.error ?? null) as Error,
      loading: LoadableUtil.isSomeLoading(loadables),
    };
  }, [colSetMembersQuery.data, colSetMapQuery.map, caseTypeSetMembersQuery.data, effectiveRights, loadables, organizationAccessCasePoliciesQuery.data, organizationShareCasePoliciesQuery.data, user, userAccessCasePoliciesQuery.data, userShareCasePoliciesQuery.data]);

  return result;
};
