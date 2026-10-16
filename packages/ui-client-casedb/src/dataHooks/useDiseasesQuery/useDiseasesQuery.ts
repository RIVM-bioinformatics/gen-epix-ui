import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbDisease } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';

export const useDiseasesQuery = (): UseQueryResult<CaseDbDisease[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(CaseDbOntologyApi).diseasesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.DISEASES),
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
