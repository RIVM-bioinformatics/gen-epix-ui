import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbMeasurement } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbMeasurement;

export const useMeasurementQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).measurementsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'measurement_id', 'Measurement'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.MEASUREMENTS),
  });
};

export const useMeasurementOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useMeasurementQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'measurement_id', 'Measurement'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'measurement_id', 'Measurement'),
    );
  }, [resourceQuery]);
};
