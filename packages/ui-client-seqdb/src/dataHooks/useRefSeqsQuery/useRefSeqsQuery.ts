import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbRefSeq } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbRefSeqWithId = { id: string } & SeqDbRefSeq;

const isRefSeqWithId = (item: SeqDbRefSeq): item is SeqDbRefSeqWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useRefSeqsQuery = (): ReturnType<typeof useQueryMemo<SeqDbRefSeqWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).refSeqsGetAll(null, null, { signal });
      if (!response.data.every(isRefSeqWithId)) {
        throw new Error('SeqDB returned a reference sequence without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.REF_SEQS),
  });
};

export const useRefSeqOptionsQuery = (): UseOptions<string> => {
  const refSeqsQuery = useRefSeqsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbRefSeqWithId>(
      refSeqsQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [refSeqsQuery]);
};
