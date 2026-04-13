import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Dim } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useCaseTypeMapQuery } from '../useCaseTypesQuery';
import { DataUtil } from '../../utils/DataUtil';

export const useDimsQuery = (): UseQueryResult<Dim[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.dimsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DIMS),
  });
};

export const useDimMapQuery = (): UseMap<Dim> => {
  const response = useDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<Dim>(response, item => item.id);
  }, [response]);
};

export const useDimNameFactory = (): UseNameFactory<Dim> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();

  return useMemo(() => {
    const getName = (item: Dim) => {
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
    return DataHookUtil.createUseOptionsDataHook<Dim>(response, item => item.id, dimNameFactory.getName, [dimNameFactory], DataUtil.rankSortComperatorFactory(dimNameFactory.getName));
  }, [dimNameFactory, response]);
};
