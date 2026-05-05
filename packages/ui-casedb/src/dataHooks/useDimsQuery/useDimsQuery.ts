import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbDim } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { useQueryMemo, QueryManager, QUERY_KEY, UseMap, DataHookUtil, UseNameFactory, UseOptions, CommonDataUtil } from '@gen-epix/ui';
import { useCaseTypeMapQuery } from '../useCaseTypesQuery';


export const useDimsQuery = (): UseQueryResult<CaseDbDim[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().dimsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.DIMS),
  });
};

export const useDimMapQuery = (): UseMap<CaseDbDim> => {
  const response = useDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbDim>(response, item => item.id);
  }, [response]);
};

export const useDimNameFactory = (): UseNameFactory<CaseDbDim> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbDim) => {
      const caseTypeName = caseTypeMapQuery.map.get(item.case_type_id)?.name ?? item.case_type_id;
      return `${caseTypeName} → ${item.label}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeMapQuery]);
  }, [caseTypeMapQuery]);
};

export const useDimOptionsQuery = (): UseOptions<string> => {
  const response = useDimsQuery();

  const dimNameFactory = useDimNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbDim>(response, item => item.id, dimNameFactory.getName, [dimNameFactory], CommonDataUtil.rankSortComperatorFactory(dimNameFactory.getName));
  }, [dimNameFactory, response]);
};
