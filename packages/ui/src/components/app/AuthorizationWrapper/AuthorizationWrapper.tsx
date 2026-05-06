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

import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { useArray } from '../../../hooks/useArray';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { LoadableUtil } from '../../../utils/LoadableUtil';
import { PageContainer } from '../../ui/PageContainer';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../../data/query';

export const AuthorizationWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();
  const matches = (useMatches() as UIMatch<unknown, MyNonIndexRouteObject['handle']>[]);

  const requiresUserProfile = useMemo(() => last(matches).handle.requiresUserProfile, [matches]);

  const userQuery = useQueryMemo({
    enabled: requiresUserProfile,
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await ConfigManager.getInstance().config.organizationApi.userMeGetOne({ signal })).data,
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.USER_ME),
    staleTime: Infinity,
  });
  const userPermissionsQuery = useQueryMemo({
    enabled: requiresUserProfile,
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await ConfigManager.getInstance().config.organizationApi.userMeRetrievePermissions({ signal })).data,
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.USER_PERMISSIONS),
    staleTime: Infinity,
  });

  const loadables = useArray([
    userQuery,
    userPermissionsQuery,
  ]);


  if (userQuery.data) {
    AuthorizationManager.getInstance().user = userQuery.data;
  }
  if (userPermissionsQuery.data) {
    AuthorizationManager.getInstance().apiPermissions = userPermissionsQuery.data;
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
