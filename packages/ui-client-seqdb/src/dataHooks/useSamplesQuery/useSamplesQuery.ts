import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbSample } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbSampleWithId = { id: string } & SeqDbSample;

const isSampleWithId = (item: SeqDbSample): item is SeqDbSampleWithId => {
  return typeof item.id === 'string';
};

export const useSamplesQuery = (): ReturnType<typeof useQueryMemo<SeqDbSampleWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).samplesGetAll(null, null, { signal });
      if (!response.data.every(isSampleWithId)) {
        throw new Error('SeqDB returned a sample without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.SAMPLES),
  });
};

export const useSampleOptionsQuery = (): UseOptions<string> => {
  const samplesQuery = useSamplesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbSampleWithId>(
      samplesQuery,
      item => item.id,
      item => item.code || item.id,
    );
  }, [samplesQuery]);
};
