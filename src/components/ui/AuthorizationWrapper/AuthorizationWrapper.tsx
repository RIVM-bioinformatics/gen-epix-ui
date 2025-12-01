import { useQuery } from '@tanstack/react-query';
import {
  useMemo,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import {
  useMatches,
  type UIMatch,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import last from 'lodash/last';

import { ResponseHandler } from '../ResponseHandler';
import { PageContainer } from '../PageContainer';
import { OrganizationApi } from '../../../api';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { QUERY_KEY } from '../../../models/query';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { useArray } from '../../../hooks/useArray';

export const AuthorizationWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const [t] = useTranslation();
  const matches = (useMatches() as UIMatch<unknown, MyNonIndexRouteObject['handle']>[]);

  const requiresUserProfile = useMemo(() => last(matches).handle.requiresUserProfile, [matches]);

  const userQuery = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_ME),
    queryFn: async ({ signal }) => (await OrganizationApi.instance.userMeGetOne({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    enabled: requiresUserProfile,
  });
  const userPermissionsQuery = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_PERMISSIONS),
    queryFn: async ({ signal }) => (await OrganizationApi.instance.userMeRetrievePermissions({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    enabled: requiresUserProfile,
  });

  const loadables = useArray([
    userQuery,
    userPermissionsQuery,
  ]);


  if (userQuery.data) {
    AuthorizationManager.instance.user = userQuery.data;
  }
  if (userPermissionsQuery.data) {
    AuthorizationManager.instance.apiPermissions = userPermissionsQuery.data;
  }

  if (requiresUserProfile && (loadables.some((l) => l.isLoading) || loadables.some((l) => l.isError))) {
    return (
      <PageContainer
        ignorePageEvent
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LoadingUserDataPage')}
        title={t`Loading user data`}
      >
        <ResponseHandler
          loadables={loadables}
          loadingMessage={t`Loading user data`}
        />
      </PageContainer>
    );
  }

  return children;
};
