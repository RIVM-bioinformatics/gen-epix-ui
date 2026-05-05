import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbCol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import { useCaseTypeMapQuery } from '../useCaseTypesQuery';
import { useDimMapQuery } from '../useDimsQuery';
import { CaseDbDataUtil } from '../../utils/CaseDbDataUtil';
import { useQueryMemo, QueryManager, QUERY_KEY, UseMap, DataHookUtil, UseNameFactory, UseOptions } from '@gen-epix/ui';

export const useColsQuery = (): UseQueryResult<CaseDbCol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().colsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.COLS),
  });
};

export const useColMapQuery = (): UseMap<CaseDbCol> => {
  const response = useColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCol>(response, item => item.id);
  }, [response]);
};

export const useColNameFactory = (): UseNameFactory<CaseDbCol> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const dimMapQuery = useDimMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbCol) => {
      const caseTypeName = caseTypeMapQuery.map.get(item.case_type_id)?.name ?? item.case_type_id;
      const dimName = dimMapQuery.map.get(item.dim_id)?.label ?? item.dim_id;

      return `${caseTypeName} → ${dimName} → ${item.label}`;

    };
    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeMapQuery, dimMapQuery]);
  }, [dimMapQuery, caseTypeMapQuery]);
};

export const useColOptionsQuery = (): UseOptions<string> => {
  const response = useColsQuery();

  const colNameFactory = useColNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCol>(response, item => item.id, colNameFactory.getName, [colNameFactory], CaseDbDataUtil.rankSortComperatorFactory(colNameFactory.getName));
  }, [colNameFactory, response]);
};
