import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbNote } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbNote;

export const useNoteQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).notesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'note_id', 'Note'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.NOTES),
  });
};

export const useNoteOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useNoteQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'note_id', 'Note'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'note_id', 'Note'),
    );
  }, [resourceQuery]);
};
