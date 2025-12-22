import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeDim } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useCaseTypeMapQuery } from '../useCaseTypesQuery';

export const useCaseTypeDimsQuery = (): UseQueryResult<CaseTypeDim[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_DIMS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseTypeDimsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeDimMapQuery = (): UseMap<CaseTypeDim> => {
  const response = useCaseTypeDimsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeDim>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeDimNameFactory = (): UseNameFactory<CaseTypeDim> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();

  return useMemo(() => {
    const getName = (item: CaseTypeDim) => {
      const caseTypeName = caseTypeMapQuery.map.get(item.case_type_id)?.name ?? item.case_type_id;
      return `${caseTypeName} → ${item.label}`;
    };
    return DataUtil.createUseNameFactoryHook(getName, [caseTypeMapQuery]);
  }, [caseTypeMapQuery]);
};

export const useCaseTypeDimOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeDimsQuery();

  const caseTypeDimNameFactory = useCaseTypeDimNameFactory();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeDim>(response, item => item.id, caseTypeDimNameFactory.getName, [caseTypeDimNameFactory]);
  }, [caseTypeDimNameFactory, response]);
};
