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

export const AuthorizationWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const [t] = useTranslation();
  const matches = (useMatches() as UIMatch<unknown, MyNonIndexRouteObject['handle']>[]);

  const requiresUserProfile = useMemo(() => last(matches).handle.requiresUserProfile, [matches]);

  const { isLoading: isUserLoading, error: userError, data: user } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_ME),
    queryFn: async ({ signal }) => (await OrganizationApi.getInstance().userMeGetOne({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    enabled: requiresUserProfile,
  });

  if (user) {
    AuthorizationManager.instance.user = user;
  }

  if (requiresUserProfile && (isUserLoading || userError)) {
    return (
      <PageContainer
        ignorePageEvent
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LoadingUserDataPage')}
        title={t`Loading user data`}
      >
        <ResponseHandler
          error={userError}
          isLoading
          loadingMessage={t`Loading user data`}
        />
      </PageContainer>
    );
  }

  return children;
};
