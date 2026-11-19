import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbLocusSetInput } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbLocusSetWithId = { id: string } & SeqDbLocusSetInput;

const isLocusSetWithId = (item: SeqDbLocusSetInput): item is SeqDbLocusSetWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useLocusSetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbLocusSetWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).locusSetsGetAll(null, null, { signal });
      if (!response.data.every(isLocusSetWithId)) {
        throw new Error('SeqDB returned a locus set without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.LOCUS_SETS),
  });
};

export const useLocusSetOptionsQuery = (): UseOptions<string> => {
  const locusSetsQuery = useLocusSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbLocusSetWithId>(
      locusSetsQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [locusSetsQuery]);
};
