import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { SeqDbTaxon } from '@gen-epix/api-seqdb';
import { SeqDbSeqApi } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type SeqDbTaxonWithId = { id: string } & SeqDbTaxon;

const isTaxonWithId = (taxon: SeqDbTaxon): taxon is SeqDbTaxonWithId => {
  return typeof taxon.id === 'string' && taxon.id.length > 0;
};

export const useTaxaQuery = (): ReturnType<typeof useQueryMemo<SeqDbTaxonWithId[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).taxaGetAll(null, null, { signal });
      if (!response.data.every(isTaxonWithId)) {
        throw new Error('SeqDB returned a taxon without an ID.');
      }

      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.TAXA),
  });
};

export const useTaxonOptionsQuery = (): UseOptions<string> => {
  const taxaQuery = useTaxaQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<SeqDbTaxonWithId>(
      taxaQuery,
      item => item.id,
      item => `${item.code} - ${item.name}`,
    );
  }, [taxaQuery]);
};
