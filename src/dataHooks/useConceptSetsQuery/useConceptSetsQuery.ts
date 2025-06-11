import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ConceptSet } from '../../api';
import { OntologyApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useConceptSetsQuery = (): UseQueryResult<ConceptSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().conceptSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useConceptSetOptionsQuery = (): UseOptions<string> => {
  const conceptSetsQuery = useConceptSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<ConceptSet>(conceptSetsQuery, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(conceptSetsQuery)]);
};
