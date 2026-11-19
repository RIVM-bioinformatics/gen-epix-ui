import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbConcept } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbConcept;

export const useConceptQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).conceptsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'concept_id', 'Concept'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS),
  });
};

export const useConceptOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useConceptQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'concept_id', 'Concept'),
      item => typeof item.concept_name === 'string' && item.concept_name.trim().length > 0 ? item.concept_name : OmopDbAdminUtil.getPrimaryKey(item, 'concept_id', 'Concept'),
    );
  }, [resourceQuery]);
};
