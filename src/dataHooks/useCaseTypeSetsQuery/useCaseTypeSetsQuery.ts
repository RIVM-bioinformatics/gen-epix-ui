import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useCaseTypeSetCategoryMapQuery } from '../useCaseTypeSetCategoriesQuery';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeSetsQuery = (): UseQueryResult<CaseTypeSet[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseTypeSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeSetsMapQuery = (): UseMap<CaseTypeSet> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseTypeSet>(caseTypeSetsQuery, item => item.id);
  }, [caseTypeSetsQuery]);
};

export const useCaseTypeSetNameFactory = (): UseNameFactory<CaseTypeSet> => {
  const caseTypeSetCategoryMapQuery = useCaseTypeSetCategoryMapQuery();

  return useMemo(() => {
    const getName = (item: CaseTypeSet) => {
      return `${caseTypeSetCategoryMapQuery.map.get(item.case_type_set_category_id)?.name ?? ''} | ${item.name}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeSetCategoryMapQuery]);
  }, [caseTypeSetCategoryMapQuery]);
};

export const useCaseTypeSetOptionsQuery = (): UseOptions<string> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseTypeSet>(
      caseTypeSetsQuery,
      item => item.id,
      caseTypeSetNameFactory.getName,
      [caseTypeSetNameFactory],
    );
  }, [caseTypeSetNameFactory, caseTypeSetsQuery]);
};
