import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbProvider } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbProvider;

export const useProviderQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).providersGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'provider_id', 'Provider'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.PROVIDERS),
  });
};

export const useProviderOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useProviderQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'provider_id', 'Provider'),
      item => typeof item.provider_name === 'string' && item.provider_name.trim().length > 0 ? item.provider_name : OmopDbAdminUtil.getPrimaryKey(item, 'provider_id', 'Provider'),
    );
  }, [resourceQuery]);
};
