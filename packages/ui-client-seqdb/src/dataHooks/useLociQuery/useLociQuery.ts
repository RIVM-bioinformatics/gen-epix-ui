import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbLocus } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbLocusWithId = { id: string } & SeqDbLocus;

const isLocusWithId = (locus: SeqDbLocus): locus is SeqDbLocusWithId => {
  return typeof locus.id === 'string' && locus.id.length > 0;
};

export const useLociQuery = (): ReturnType<typeof useQueryMemo<SeqDbLocusWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).lociGetAll(null, null, { signal });
      if (!response.data.every(isLocusWithId)) {
        throw new Error('SeqDB returned a locus without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.LOCI),
  });
};

export const useLocusOptionsQuery = (): UseOptions<string> => {
  const lociQuery = useLociQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbLocusWithId>(
      lociQuery,
      item => item.id,
      item => item.name ? `${item.code} - ${item.name}` : item.code,
    );
  }, [lociQuery]);
};
