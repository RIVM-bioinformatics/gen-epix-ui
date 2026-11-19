import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbSeqProfile } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbSeqProfileWithId = { id: string } & SeqDbSeqProfile;

const isSeqProfileWithId = (item: SeqDbSeqProfile): item is SeqDbSeqProfileWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useSeqProfilesQuery = (): ReturnType<typeof useQueryMemo<SeqDbSeqProfileWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).seqProfilesGetAll(null, null, { signal });
      if (!response.data.every(isSeqProfileWithId)) {
        throw new Error('SeqDB returned a sequence profile without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.SEQ_PROFILES),
  });
};

export const useSeqProfileOptionsQuery = (): UseOptions<string> => {
  const seqProfilesQuery = useSeqProfilesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbSeqProfileWithId>(
      seqProfilesQuery,
      item => item.id,
      item => item.id,
    );
  }, [seqProfilesQuery]);
};
