import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbConceptClass } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbConceptClass;

export const useConceptClassQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).conceptClasssGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'concept_class_id', 'Concept class'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.CONCEPT_CLASSES),
  });
};

export const useConceptClassOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useConceptClassQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'concept_class_id', 'Concept class'),
      item => typeof item.concept_class_name === 'string' && item.concept_class_name.trim().length > 0 ? item.concept_class_name : OmopDbAdminUtil.getPrimaryKey(item, 'concept_class_id', 'Concept class'),
    );
  }, [resourceQuery]);
};
