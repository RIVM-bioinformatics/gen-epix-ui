import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbNoteNlp } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbNoteNlp;

export const useNoteNlpQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).noteNlpsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'note_nlp_id', 'Note NLP'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.NOTE_NLPS),
  });
};

export const useNoteNlpOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useNoteNlpQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'note_nlp_id', 'Note NLP'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'note_nlp_id', 'Note NLP'),
    );
  }, [resourceQuery]);
};
