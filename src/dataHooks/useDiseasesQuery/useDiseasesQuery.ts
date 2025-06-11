import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Disease } from '../../api';
import { OntologyApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useDiseasesQuery = (): UseQueryResult<Disease[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DISEASES),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().diseasesGetAll({ signal });
      return response.data;
    },
  });
};

export const useDiseasesMapQuery = (): UseMap<Disease> => {
  const diseasesQuery = useDiseasesQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Disease>(diseasesQuery, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(diseasesQuery)]);
};

export const useDiseaseOptionsQuery = (): UseOptions<string> => {
  const diseasesQuery = useDiseasesQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Disease>(diseasesQuery, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(diseasesQuery)]);
};
