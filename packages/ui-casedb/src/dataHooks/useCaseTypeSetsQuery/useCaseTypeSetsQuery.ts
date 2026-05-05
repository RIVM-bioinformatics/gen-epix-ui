import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbCaseTypeSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

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

export const useCaseTypeSetsQuery = (): UseQueryResult<CaseDbCaseTypeSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseTypeSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SETS),
  });
};

export const useCaseTypeSetsMapQuery = (): UseMap<CaseDbCaseTypeSet> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseTypeSet>(caseTypeSetsQuery, item => item.id);
  }, [caseTypeSetsQuery]);
};

export const useCaseTypeSetNameFactory = (): UseNameFactory<CaseDbCaseTypeSet> => {
  const caseTypeSetCategoryMapQuery = useCaseTypeSetCategoryMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbCaseTypeSet) => {
      return `${caseTypeSetCategoryMapQuery.map.get(item.case_type_set_category_id)?.name ?? ''} | ${item.name}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeSetCategoryMapQuery]);
  }, [caseTypeSetCategoryMapQuery]);
};

export const useCaseTypeSetOptionsQuery = (): UseOptions<string> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseTypeSet>(
      caseTypeSetsQuery,
      item => item.id,
      caseTypeSetNameFactory.getName,
      [caseTypeSetNameFactory],
    );
  }, [caseTypeSetNameFactory, caseTypeSetsQuery]);
};
