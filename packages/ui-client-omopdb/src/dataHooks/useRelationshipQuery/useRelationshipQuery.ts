import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbRelationship } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbRelationship;

export const useRelationshipQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).relationshipsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'relationship_id', 'Relationship'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.RELATIONSHIPS),
  });
};

export const useRelationshipOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useRelationshipQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'relationship_id', 'Relationship'),
      item => typeof item.relationship_name === 'string' && item.relationship_name.trim().length > 0 ? item.relationship_name : OmopDbAdminUtil.getPrimaryKey(item, 'relationship_id', 'Relationship'),
    );
  }, [resourceQuery]);
};
