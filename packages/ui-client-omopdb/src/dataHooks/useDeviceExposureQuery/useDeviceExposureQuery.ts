import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbDeviceExposure } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbDeviceExposure;

export const useDeviceExposureQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).deviceExposuresGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'device_exposure_id', 'Device exposure'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.DEVICE_EXPOSURES),
  });
};

export const useDeviceExposureOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useDeviceExposureQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'device_exposure_id', 'Device exposure'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'device_exposure_id', 'Device exposure'),
    );
  }, [resourceQuery]);
};
