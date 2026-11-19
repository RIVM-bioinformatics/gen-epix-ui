import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbModelFile } from '@gen-epix/api-seqdb';
import { SeqDbFileApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbModelFileWithId = { id: string } & SeqDbModelFile;

const isModelFileWithId = (item: SeqDbModelFile): item is SeqDbModelFileWithId => {
  return typeof item.id === 'string';
};

export const useFilesQuery = (): ReturnType<typeof useQueryMemo<SeqDbModelFileWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbFileApi).filesGetAll(null, null, { signal });
      if (!response.data.every(isModelFileWithId)) {
        throw new Error('SeqDB returned a file without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.FILES),
  });
};

export const useFileOptionsQuery = (): UseOptions<string> => {
  const filesQuery = useFilesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbModelFileWithId>(
      filesQuery,
      item => item.id,
      item => item.id,
    );
  }, [filesQuery]);
};
