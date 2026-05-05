import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbConceptSet } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useConceptSetsQuery = (): UseQueryResult<CaseDbConceptSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.instance.conceptSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS),
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
