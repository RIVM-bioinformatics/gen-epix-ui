import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbConcept } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';

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
import { DataUtil } from '../../utils/DataUtil';

export const useConceptQuery = (): UseQueryResult<CaseDbConcept[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.instance.conceptsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPTS),
  });
};

export const useConceptMapQuery = (): UseMap<CaseDbConcept> => {
  const response = useConceptQuery();
  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbConcept>(response, item => item.id);
  }, [response]);
};

export const useConceptNameFactory = (): UseNameFactory<CaseDbConcept> => {
  const conceptSetMapQuery = useConceptSetMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbConcept) => {
      return `${conceptSetMapQuery.map.get(item.concept_set_id)?.name ?? item.concept_set_id} → ${item.name}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [conceptSetMapQuery]);
  }, [conceptSetMapQuery]);
};

export const useConceptOptionsQuery = (): UseOptions<string> => {
  const conceptQuery = useConceptQuery();
  const conceptNameFactory = useConceptNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbConcept>(conceptQuery, item => item.id, conceptNameFactory.getName, [conceptNameFactory], DataUtil.rankSortComperatorFactory(conceptNameFactory.getName));
  }, [conceptNameFactory, conceptQuery]);
};
