import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbTaxonSet } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbTaxonSetWithId = { id: string } & SeqDbTaxonSet;

const isTaxonSetWithId = (item: SeqDbTaxonSet): item is SeqDbTaxonSetWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

export const useTaxonSetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbTaxonSetWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).taxonSetsGetAll(null, null, { signal });
      if (!response.data.every(isTaxonSetWithId)) {
        throw new Error('SeqDB returned a taxon set without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.TAXON_SETS),
  });
};

export const useTaxonSetOptionsQuery = (): UseOptions<string> => {
  const taxonSetsQuery = useTaxonSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbTaxonSetWithId>(
      taxonSetsQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [taxonSetsQuery]);
};
