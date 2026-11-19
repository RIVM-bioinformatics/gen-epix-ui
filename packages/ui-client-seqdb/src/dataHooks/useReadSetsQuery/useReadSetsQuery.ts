import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbReadSet } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbReadSetWithId = { id: string } & SeqDbReadSet;

const isReadSetWithId = (item: SeqDbReadSet): item is SeqDbReadSetWithId => {
  return typeof item.id === 'string';
};

export const useReadSetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbReadSetWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).readSetsGetAll(null, null, { signal });
      if (!response.data.every(isReadSetWithId)) {
        throw new Error('SeqDB returned a read set without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.READ_SETS),
  });
};

export const useReadSetOptionsQuery = (): UseOptions<string> => {
  const readSetsQuery = useReadSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbReadSetWithId>(
      readSetsQuery,
      item => item.id,
      item => item.code || item.id,
    );
  }, [readSetsQuery]);
};
