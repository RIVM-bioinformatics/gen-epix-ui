import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRefDim } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useRefDimsQuery = (): UseQueryResult<CaseDbRefDim[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.refDimsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REF_DIMS),
  });
};

export const useRefDimMapQuery = (): UseMap<CaseDbRefDim> => {
  const response = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRefDim>(response, item => item.id);
  }, [response]);
};

export const useRefDimOptionsQuery = (): UseOptions<string> => {
  const dimsQuery = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRefDim>(dimsQuery, item => item.id, item => item.label, [], DataUtil.rankSortComperatorFactory('label'));
  }, [dimsQuery]);
};
