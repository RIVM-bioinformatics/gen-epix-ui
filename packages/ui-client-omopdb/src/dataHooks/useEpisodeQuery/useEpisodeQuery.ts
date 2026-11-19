import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbEpisode } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbEpisode;

export const useEpisodeQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).episodesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'episode_id', 'Episode'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.EPISODES),
  });
};

export const useEpisodeOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useEpisodeQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'episode_id', 'Episode'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'episode_id', 'Episode'),
    );
  }, [resourceQuery]);
};
