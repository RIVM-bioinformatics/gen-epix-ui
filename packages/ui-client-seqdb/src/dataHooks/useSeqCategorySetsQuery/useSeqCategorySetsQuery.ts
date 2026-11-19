import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbSeqCategorySet } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbSeqCategorySetWithId = { id: string } & SeqDbSeqCategorySet;

const isSeqCategorySetWithId = (item: SeqDbSeqCategorySet): item is SeqDbSeqCategorySetWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useSeqCategorySetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbSeqCategorySetWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).seqCategorySetsGetAll(null, null, { signal });
      if (!response.data.every(isSeqCategorySetWithId)) {
        throw new Error('SeqDB returned a sequence category set without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.SEQ_CATEGORY_SETS),
  });
};

export const useSeqCategorySetOptionsQuery = (): UseOptions<string> => {
  const seqCategorySetsQuery = useSeqCategorySetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbSeqCategorySetWithId>(
      seqCategorySetsQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [seqCategorySetsQuery]);
};
