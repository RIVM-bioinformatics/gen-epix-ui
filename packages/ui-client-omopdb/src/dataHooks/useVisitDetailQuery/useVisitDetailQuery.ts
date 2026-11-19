import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbVisitDetail } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbVisitDetail;

export const useVisitDetailQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).visitDetailsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'visit_detail_id', 'Visit detail'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.VISIT_DETAILS),
  });
};

export const useVisitDetailOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useVisitDetailQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'visit_detail_id', 'Visit detail'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'visit_detail_id', 'Visit detail'),
    );
  }, [resourceQuery]);
};
