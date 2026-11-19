import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbDrugExposure } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbDrugExposure;

export const useDrugExposureQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).drugExposuresGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'drug_exposure_id', 'Drug exposure'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.DRUG_EXPOSURES),
  });
};

export const useDrugExposureOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useDrugExposureQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'drug_exposure_id', 'Drug exposure'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'drug_exposure_id', 'Drug exposure'),
    );
  }, [resourceQuery]);
};
