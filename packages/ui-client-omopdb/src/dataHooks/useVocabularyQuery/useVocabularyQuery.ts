import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbVocabulary } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbVocabulary;

export const useVocabularyQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).vocabulariesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'vocabulary_id', 'Vocabulary'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.VOCABULARIES),
  });
};

export const useVocabularyOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useVocabularyQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'vocabulary_id', 'Vocabulary'),
      item => typeof item.vocabulary_name === 'string' && item.vocabulary_name.trim().length > 0 ? item.vocabulary_name : OmopDbAdminUtil.getPrimaryKey(item, 'vocabulary_id', 'Vocabulary'),
    );
  }, [resourceQuery]);
};
