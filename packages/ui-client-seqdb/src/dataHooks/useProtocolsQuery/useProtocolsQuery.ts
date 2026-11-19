import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbProtocol } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbProtocolWithId = { id: string } & SeqDbProtocol;

const isProtocolWithId = (item: SeqDbProtocol): item is SeqDbProtocolWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useProtocolsQuery = (): ReturnType<typeof useQueryMemo<SeqDbProtocolWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).protocolsGetAll(null, null, { signal });
      if (!response.data.every(isProtocolWithId)) {
        throw new Error('SeqDB returned a protocol without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.PROTOCOLS),
  });
};

export const useProtocolOptionsQuery = (): UseOptions<string> => {
  const protocolsQuery = useProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbProtocolWithId>(
      protocolsQuery,
      item => item.id,
      item => item.name || item.code || item.id,
    );
  }, [protocolsQuery]);
};
