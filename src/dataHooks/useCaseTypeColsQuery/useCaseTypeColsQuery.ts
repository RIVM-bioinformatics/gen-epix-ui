import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeCol } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useCaseTypeMapQuery } from '../useCaseTypesQuery';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useCaseTypeDimMapQuery } from '../useCaseTypeDimsQuery';

export const useCaseTypeColsQuery = (): UseQueryResult<CaseTypeCol[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseTypeColsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeColMapQuery = (): UseMap<CaseTypeCol> => {
  const response = useCaseTypeColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseTypeCol>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeColNameFactory = (): UseNameFactory<CaseTypeCol> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const caseTypeDimMapQuery = useCaseTypeDimMapQuery();

  return useMemo(() => {
    const getName = (item: CaseTypeCol) => {
      const caseTypeName = caseTypeMapQuery.map.get(item.case_type_id)?.name ?? item.case_type_id;
      const caseTypeDimName = caseTypeDimMapQuery.map.get(item.case_type_dim_id)?.label ?? item.case_type_dim_id;

      return `${caseTypeName} → ${caseTypeDimName} → ${item.label}`;

    };
    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeMapQuery, caseTypeDimMapQuery]);
  }, [caseTypeDimMapQuery, caseTypeMapQuery]);
};

export const useCaseTypeColOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeColsQuery();

  const caseTypeColNameFactory = useCaseTypeColNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseTypeCol>(response, item => item.id, caseTypeColNameFactory.getName, [caseTypeColNameFactory]);
  }, [caseTypeColNameFactory, response]);
};
