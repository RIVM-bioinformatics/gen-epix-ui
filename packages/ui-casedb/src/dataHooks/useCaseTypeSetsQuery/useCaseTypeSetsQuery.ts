import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbCaseTypeSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { useCaseTypeSetCategoryMapQuery } from '../useCaseTypeSetCategoriesQuery';
import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useCaseTypeSetsQuery = (): UseQueryResult<CaseDbCaseTypeSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypeSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_SETS),
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
