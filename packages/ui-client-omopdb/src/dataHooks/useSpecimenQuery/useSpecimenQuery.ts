import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbSpecimen } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbSpecimen;

export const useSpecimenQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).specimensGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'specimen_id', 'Specimen'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.SPECIMENS),
  });
};

export const useSpecimenOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useSpecimenQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'specimen_id', 'Specimen'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'specimen_id', 'Specimen'),
    );
  }, [resourceQuery]);
};
