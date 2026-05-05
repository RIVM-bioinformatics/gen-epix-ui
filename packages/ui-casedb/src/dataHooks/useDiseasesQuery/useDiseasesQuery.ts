import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbDisease } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDiseasesQuery = (): UseQueryResult<CaseDbDisease[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.instance.diseasesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DISEASES),
  });
};

export const useDiseasesMapQuery = (): UseMap<CaseDbDisease> => {
  const diseasesQuery = useDiseasesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbDisease>(diseasesQuery, item => item.id);
  }, [diseasesQuery]);
};

export const useDiseaseOptionsQuery = (): UseOptions<string> => {
  const diseasesQuery = useDiseasesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbDisease>(diseasesQuery, item => item.id, item => item.name);
  }, [diseasesQuery]);
};
