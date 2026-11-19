import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbPayerPlanPeriod } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbPayerPlanPeriod;

export const usePayerPlanPeriodQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).payerPlanPeriodsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'payer_plan_period_id', 'Payer plan period'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.PAYER_PLAN_PERIODS),
  });
};

export const usePayerPlanPeriodOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = usePayerPlanPeriodQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'payer_plan_period_id', 'Payer plan period'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'payer_plan_period_id', 'Payer plan period'),
    );
  }, [resourceQuery]);
};
