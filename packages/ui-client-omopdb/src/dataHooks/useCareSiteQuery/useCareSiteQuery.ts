import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbCareSite } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbCareSite;

export const useCareSiteQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).careSitesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'care_site_id', 'Care site'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.CARE_SITES),
  });
};

export const useCareSiteOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useCareSiteQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'care_site_id', 'Care site'),
      item => typeof item.care_site_name === 'string' && item.care_site_name.trim().length > 0 ? item.care_site_name : OmopDbAdminUtil.getPrimaryKey(item, 'care_site_id', 'Care site'),
    );
  }, [resourceQuery]);
};
