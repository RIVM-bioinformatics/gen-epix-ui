import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbConceptSet } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useConceptSetsQuery = (): UseQueryResult<CaseDbConceptSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.getInstance().conceptSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS),
  });
};

export const useConceptSetMapQuery = (): UseMap<CaseDbConceptSet> => {
  const response = useConceptSetsQuery();
  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbConceptSet>(response, item => item.id);
  }, [response]);
};

export const useConceptSetOptionsQuery = (): UseOptions<string> => {
  const conceptSetsQuery = useConceptSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbConceptSet>(conceptSetsQuery, item => item.id, item => item.name);
  }, [conceptSetsQuery]);
};
