import {
  type PropsWithChildren,
  type ReactNode,
  useMemo,
} from 'react';
import {
  type UIMatch,
  useMatches,
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
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { LoadableUtil } from '../../../utils/LoadableUtil';

export const AuthorizationWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();
  const matches = (useMatches() as UIMatch<unknown, MyNonIndexRouteObject['handle']>[]);

  const requiresUserProfile = useMemo(() => last(matches).handle.requiresUserProfile, [matches]);

  const userQuery = useQueryMemo({
    enabled: requiresUserProfile,
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await OrganizationApi.instance.userMeGetOne({ signal })).data,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_ME),
    staleTime: Infinity,
  });
  const userPermissionsQuery = useQueryMemo({
    enabled: requiresUserProfile,
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await OrganizationApi.instance.userMeRetrievePermissions({ signal })).data,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_PERMISSIONS),
    staleTime: Infinity,
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

  if (requiresUserProfile && (LoadableUtil.isSomeLoading(loadables) || LoadableUtil.hasSomeError(loadables))) {
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
