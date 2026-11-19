import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbProtocolSet } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbProtocolSetWithId = { id: string } & SeqDbProtocolSet;

const isProtocolSetWithId = (item: SeqDbProtocolSet): item is SeqDbProtocolSetWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useProtocolSetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbProtocolSetWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).protocolSetsGetAll(null, null, { signal });
      if (!response.data.every(isProtocolSetWithId)) {
        throw new Error('SeqDB returned a protocol set without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.PROTOCOL_SETS),
  });
};

export const useProtocolSetOptionsQuery = (): UseOptions<string> => {
  const protocolSetsQuery = useProtocolSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbProtocolSetWithId>(
      protocolSetsQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [protocolSetsQuery]);
};
