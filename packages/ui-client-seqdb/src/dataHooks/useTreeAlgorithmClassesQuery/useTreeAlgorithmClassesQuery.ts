import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbTreeAlgorithmClass } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbTreeAlgorithmClassWithId = { id: string } & SeqDbTreeAlgorithmClass;

const isTreeAlgorithmClassWithId = (item: SeqDbTreeAlgorithmClass): item is SeqDbTreeAlgorithmClassWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useTreeAlgorithmClassesQuery = (): ReturnType<typeof useQueryMemo<SeqDbTreeAlgorithmClassWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).treeAlgorithmClassesGetAll(null, null, { signal });
      if (!response.data.every(isTreeAlgorithmClassWithId)) {
        throw new Error('SeqDB returned a tree algorithm class without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.TREE_ALGORITHM_CLASSES),
  });
};

export const useTreeAlgorithmClassOptionsQuery = (): UseOptions<string> => {
  const treeAlgorithmClassesQuery = useTreeAlgorithmClassesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbTreeAlgorithmClassWithId>(
      treeAlgorithmClassesQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [treeAlgorithmClassesQuery]);
};
