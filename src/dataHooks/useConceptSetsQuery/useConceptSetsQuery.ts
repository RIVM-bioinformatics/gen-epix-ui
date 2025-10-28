import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ConceptSet } from '../../api';
import { OntologyApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useConceptSetsQuery = (): UseQueryResult<ConceptSet[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().conceptSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useConceptSetMapQuery = (): UseMap<ConceptSet> => {
  const response = useConceptSetsQuery();
  return useMemo(() => {
    return DataUtil.createUseMapDataHook<ConceptSet>(response, item => item.id);
  }, [response]);
};

export const useConceptSetOptionsQuery = (): UseOptions<string> => {
  const conceptSetsQuery = useConceptSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<ConceptSet>(conceptSetsQuery, item => item.id, item => item.name);
  }, [conceptSetsQuery]);
};
