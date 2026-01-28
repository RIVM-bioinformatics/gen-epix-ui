import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Concept } from '../../api';
import { OntologyApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useConceptSetMapQuery } from '../useConceptSetsQuery';

export const useConceptQuery = (): UseQueryResult<Concept[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.instance.conceptsGetAll({ signal });
      return response.data;
    },
  });
};

export const useConceptMapQuery = (): UseMap<Concept> => {
  const response = useConceptQuery();
  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<Concept>(response, item => item.id);
  }, [response]);
};

export const useConceptNameFactory = (): UseNameFactory<Concept> => {
  const conceptSetMapQuery = useConceptSetMapQuery();

  return useMemo(() => {
    const getName = (item: Concept) => {
      return `${conceptSetMapQuery.map.get(item.concept_set_id)?.name ?? item.concept_set_id} → ${item.name}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [conceptSetMapQuery]);
  }, [conceptSetMapQuery]);
};

export const useConceptOptionsQuery = (): UseOptions<string> => {
  const conceptQuery = useConceptQuery();
  const conceptNameFactory = useConceptNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Concept>(conceptQuery, item => item.id, conceptNameFactory.getName, [conceptNameFactory]);
  }, [conceptNameFactory, conceptQuery]);
};
