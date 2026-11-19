import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbObservationPeriod } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbObservationPeriod;

export const useObservationPeriodQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).observationPeriodsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'observation_period_id', 'Observation period'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.OBSERVATION_PERIODS),
  });
};

export const useObservationPeriodOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useObservationPeriodQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'observation_period_id', 'Observation period'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'observation_period_id', 'Observation period'),
    );
  }, [resourceQuery]);
};
