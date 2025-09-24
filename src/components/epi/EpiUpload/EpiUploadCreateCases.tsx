import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useId,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
} from '@mui/material';

import {
  CaseApi,
  type ValidatedCase,
} from '../../../api';
import {
  EPI_UPLOAD_ACTION,
  type EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QueryUtil } from '../../../utils/QueryUtil';
import { QUERY_KEY } from '../../../models/query';
import { Spinner } from '../../ui/Spinner';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RouterManager } from '../../../classes/managers/RouterManager';


export type EpiUploadCreateCasesProps = {
  readonly selectFileResult: EpiUploadSelectFileResult;
  readonly validatedCases: ValidatedCase[];
  readonly onStartOver: () => void;
};

export const EpiUploadCreateCases = ({ selectFileResult, validatedCases, onStartOver }: EpiUploadCreateCasesProps) => {
  const [t] = useTranslation();
  const queryId = useId();

  const createCasesQuery = useQueryMemo({
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

  const onStartOverButtonClick = useCallback(() => {
    onStartOver();
  }, [onStartOver]);

  const onGotoCasesButtonClick = useCallback(async () => {
    const link = EpiCaseTypeUtil.createCaseTypeLink(selectFileResult.completeCaseType);
    await RouterManager.instance.router.navigate(link);
  }, [selectFileResult.completeCaseType]);

  if (createCasesQuery.isLoading) {
    return <Spinner label={t`Uploading cases...`} />;
  }
  if (createCasesQuery.isError) {
    return (
      <Box>
        <Alert severity={'error'}>
          {t`An error occurred while uploading cases`}
        </Alert>
      </Box>
    );
  }
  return (
    <Container maxWidth={'xl'}>
      <Alert severity={'success'}>
        {t('Successfully uploaded {{numCases}} cases.', { numCases: createCasesQuery.data?.length ?? 0 })}
      </Alert>
      <Box
        marginTop={2}
        marginBottom={1}
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant={'outlined'}
          onClick={onStartOverButtonClick}
        >
          {t('Upload more cases')}
        </Button>
        <Button
          variant={'contained'}
          onClick={onGotoCasesButtonClick}
        >
          {t('View uploaded cases')}
        </Button>
      </Box>
    </Container>
  );
};
