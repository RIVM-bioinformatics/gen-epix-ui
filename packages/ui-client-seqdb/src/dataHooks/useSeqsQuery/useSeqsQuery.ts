import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbSeq } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbSeqWithId = { id: string } & SeqDbSeq;

const isSeqWithId = (item: SeqDbSeq): item is SeqDbSeqWithId => {
  return typeof item.id === 'string';
};

export const useSeqsQuery = (): ReturnType<typeof useQueryMemo<SeqDbSeqWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).seqsGetAll(null, null, { signal });
      if (!response.data.every(isSeqWithId)) {
        throw new Error('SeqDB returned a sequence without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.SEQS),
  });
};

export const useSeqOptionsQuery = (): UseOptions<string> => {
  const seqsQuery = useSeqsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbSeqWithId>(
      seqsQuery,
      item => item.id,
      item => item.code || item.id,
    );
  }, [seqsQuery]);
};
