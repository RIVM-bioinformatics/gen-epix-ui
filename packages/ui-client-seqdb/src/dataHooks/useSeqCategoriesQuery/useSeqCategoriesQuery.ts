import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbSeqCategory } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbSeqCategoryWithId = { id: string } & SeqDbSeqCategory;

const isSeqCategoryWithId = (item: SeqDbSeqCategory): item is SeqDbSeqCategoryWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useSeqCategoriesQuery = (): ReturnType<typeof useQueryMemo<SeqDbSeqCategoryWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).seqCategoriesGetAll(null, null, { signal });
      if (!response.data.every(isSeqCategoryWithId)) {
        throw new Error('SeqDB returned a sequence category without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.SEQ_CATEGORIES),
  });
};

export const useSeqCategoryOptionsQuery = (): UseOptions<string> => {
  const seqCategoriesQuery = useSeqCategoriesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbSeqCategoryWithId>(
      seqCategoriesQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [seqCategoriesQuery]);
};
