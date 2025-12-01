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
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useCaseTypeMapQuery } from '../useCaseTypesQuery';
import { useQueryMemo } from '../../hooks/useQueryMemo';

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
    return DataUtil.createUseMapDataHook<CaseTypeCol>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeColNameFactory = (): UseNameFactory<CaseTypeCol> => {
  const caseTypeMapQuery = useCaseTypeMapQuery();

  return useMemo(() => {
    const getName = (item: CaseTypeCol) => {

      return `${caseTypeMapQuery.map.get(item.case_type_id)?.name ?? item.case_type_id} → ${item.label}`;
    };
    return DataUtil.createUseNameFactoryHook(getName, [caseTypeMapQuery]);
  }, [caseTypeMapQuery]);
};

export const useCaseTypeColOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeColsQuery();

  const caseTypeColNameFactory = useCaseTypeColNameFactory();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeCol>(response, item => item.id, caseTypeColNameFactory.getName, [caseTypeColNameFactory]);
  }, [caseTypeColNameFactory, response]);
};
