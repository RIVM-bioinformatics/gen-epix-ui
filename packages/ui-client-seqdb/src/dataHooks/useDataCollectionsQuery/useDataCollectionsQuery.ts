import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbDataCollection } from '@gen-epix/api-seqdb';
import { SeqDbOrganizationApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbDataCollectionWithId = { id: string } & SeqDbDataCollection;

const isDataCollectionWithId = (item: SeqDbDataCollection): item is SeqDbDataCollectionWithId => {
  return typeof item.id === 'string';
};

export const useDataCollectionsQuery = (): ReturnType<typeof useQueryMemo<SeqDbDataCollectionWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbOrganizationApi).dataCollectionsGetAll(null, null, { signal });
      if (!response.data.every(isDataCollectionWithId)) {
        throw new Error('SeqDB returned a data collection without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.DATA_COLLECTIONS),
  });
};

export const useDataCollectionOptionsQuery = (): UseOptions<string> => {
  const dataCollectionsQuery = useDataCollectionsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbDataCollectionWithId>(
      dataCollectionsQuery,
      item => item.id,
      item => item.name || item.id,
    );
  }, [dataCollectionsQuery]);
};
