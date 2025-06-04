import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
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
import { useCaseTypeMap } from '../useCaseTypes';

export const useCaseTypeCols = (): UseQueryResult<CaseTypeCol[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeColsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeColMap = (): UseMap<CaseTypeCol> => {
  const response = useCaseTypeCols();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeCol>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeColNameFactory = (): UseNameFactory<CaseTypeCol> => {
  const caseTypesMap = useCaseTypeMap();

  return useMemo(() => {
    const getName = (item: CaseTypeCol) => {

      return `${caseTypesMap.map.get(item.case_type_id)?.name ?? item.case_type_id} → ${item.label}`;
    };
    return DataUtil.createUseNameFactoryHook(getName, [caseTypesMap]);
  }, [caseTypesMap]);

};

export const useCaseTypeColOptions = (): UseOptions<string> => {
  const response = useCaseTypeCols();

  const caseTypeColNameFactory = useCaseTypeColNameFactory();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeCol>(response, item => item.id, caseTypeColNameFactory.getName, [caseTypeColNameFactory]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseTypeColNameFactory, DataUtil.createMemorizationDependency(response)]);
};
