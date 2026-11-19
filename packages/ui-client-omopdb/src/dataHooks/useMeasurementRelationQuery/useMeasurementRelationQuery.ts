import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbMeasurementRelation } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbMeasurementRelation;

export const useMeasurementRelationQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).measurementRelationsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'measurement_relation_id', 'Measurement relation'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.MEASUREMENT_RELATIONS),
  });
};

export const useMeasurementRelationOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useMeasurementRelationQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'measurement_relation_id', 'Measurement relation'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'measurement_relation_id', 'Measurement relation'),
    );
  }, [resourceQuery]);
};
