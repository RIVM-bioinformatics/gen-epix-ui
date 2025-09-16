import { useTranslation } from 'react-i18next';
import { useId } from 'react';

import {
  CaseApi,
  type ValidatedCase,
} from '../../../api';
import {
  EPI_UPLOAD_ACTION,
  type EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { useArray } from '../../../hooks/useArray';
import { QueryUtil } from '../../../utils/QueryUtil';
import { QUERY_KEY } from '../../../models/query';


export type EpiUploadCreateCasesProps = {
  readonly selectFileResult: EpiUploadSelectFileResult;
  readonly validatedCases: ValidatedCase[];
};

export const EpiUploadCreateCases = ({ selectFileResult, validatedCases }: EpiUploadCreateCasesProps) => {
  const [t] = useTranslation();
  const queryId = useId();

  const createQuery = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CREATE_CASES, queryId),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.createCases({
        case_type_id: selectFileResult.case_type_id,
        created_in_data_collection_id: selectFileResult.create_in_data_collection_id,
        data_collection_ids: selectFileResult.share_in_data_collection_ids,
        is_update: selectFileResult.import_action === EPI_UPLOAD_ACTION.UPDATE,
        cases: validatedCases.map(c => c.case),
      }, { signal });
      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CREATE_CASES], false));
      return response.data;
    },
    gcTime: 0,
    staleTime: 0,
  });

  const loadables = useArray([createQuery]);

  return (
    <ResponseHandler
      inlineSpinner
      shouldHideActionButtons
      loadables={loadables}
      loadingMessage={t`Uploading...`}
    >
      {t`All cases have been successfully uploaded.`}
    </ResponseHandler>
  );
};
