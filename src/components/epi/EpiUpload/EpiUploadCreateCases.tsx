import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
} from '@mui/material';
import difference from 'lodash/difference';
import { useStore } from 'zustand';

import { CaseApi } from '../../../api';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QueryUtil } from '../../../utils/QueryUtil';
import { QUERY_KEY } from '../../../models/query';
import { Spinner } from '../../ui/Spinner';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadCreateCases = () => {
  const [t] = useTranslation();
  const queryId = useId();

  const store = useContext(EpiUploadStoreContext);
  const reset = useStore(store, (state) => state.reset);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const sequenceMapping = useStore(store, (state) => state.sequenceMapping);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const case_type_id = useStore(store, (state) => state.case_type_id);
  const import_action = useStore(store, (state) => state.import_action);
  const created_in_data_collection_id = useStore(store, (state) => state.created_in_data_collection_id);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const rawData = useStore(store, (state) => state.rawData);
  const share_in_data_collection_ids = useStore(store, (state) => state.share_in_data_collection_ids);


  const [isUploadStarted, setIsUploadStarted] = useState(false);

  const createCasesQuery = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CREATE_CASES, queryId),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.createCases({
        case_type_id,
        created_in_data_collection_id,
        data_collection_ids: share_in_data_collection_ids,
        is_update: import_action === EPI_UPLOAD_ACTION.UPDATE,
        cases: validatedCases.map(c => c.case),
      }, { signal });
      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CREATE_CASES], false));
      return response.data;
    },
    gcTime: 0,
    staleTime: 0,
    enabled: isUploadStarted,
  });

  const sequenceFileStats = useMemo(() => {
    const mappedFiles = Object.values(sequenceMapping).flatMap(x => Object.values(x));
    const mappedSequenceFiles = mappedFiles.filter(x => EpiUploadUtil.isGenomeFile(x));
    const mappedReadsFiles = mappedFiles.filter(x => EpiUploadUtil.isReadsFile(x));
    const unmappedFiles = difference(Array.from(sequenceFilesDataTransfer.files).map(f => f.name), mappedFiles);
    const unmappedSequenceFiles = unmappedFiles.filter(x => EpiUploadUtil.isGenomeFile(x));
    const unmappedReadsFiles = unmappedFiles.filter(x => EpiUploadUtil.isReadsFile(x));

    return {
      mappedFiles,
      mappedSequenceFiles,
      mappedReadsFiles,
      unmappedFiles,
      unmappedSequenceFiles,
      unmappedReadsFiles,
    };
  }, [sequenceFilesDataTransfer.files, sequenceMapping]);

  const onStartOverButtonClick = useCallback(async () => {
    await reset();
  }, [reset]);

  const onStartUploadButtonClick = useCallback(() => {
    setIsUploadStarted(true);
  }, []);

  const onGotoCasesButtonClick = useCallback(async () => {
    const link = EpiCaseTypeUtil.createCaseTypeLink(completeCaseType);
    await RouterManager.instance.router.navigate(link);
  }, [completeCaseType]);

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
    <Container
      maxWidth={'xl'}
      sx={{
        height: '100%',
      }}
    >
      {!isUploadStarted && (
        <Box>
          <Box marginY={2}>
            <Alert severity={'info'}>
              <AlertTitle>
                {t('{{numCases}} cases are ready to be uploaded.', { numCases: validatedCases.length })}
              </AlertTitle>
            </Alert>
          </Box>
          {sequenceFileStats.mappedSequenceFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('{{numSequenceFiles}} sequence files are ready to be uploaded.', { numSequenceFiles: sequenceFileStats.mappedSequenceFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.mappedReadsFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('{{numReadsFiles}} reads files are ready to be uploaded.', { numReadsFiles: sequenceFileStats.mappedReadsFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {(rawData.length - 1) - validatedCases.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{numCases}} cases were not selected and will not be uploaded.', { numCases: (rawData.length - 1) - validatedCases.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.unmappedSequenceFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{unmappedSequenceFiles}} unmapped sequence files will not be uploaded.', { unmappedSequenceFiles: sequenceFileStats.unmappedSequenceFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.unmappedReadsFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{unmappedReadsFiles}} unmapped reads files will not be uploaded.', { unmappedReadsFiles: sequenceFileStats.unmappedReadsFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
        </Box>
      )}
      {isUploadStarted && (
        <Alert severity={'success'}>
          <AlertTitle>
            {t('Successfully uploaded {{numCases}} cases.', { numCases: createCasesQuery.data?.length ?? 0 })}
          </AlertTitle>
        </Alert>
      )}
      {!isUploadStarted && (
        <EpiUploadNavigation
          proceedLabel={'Start upload'}
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onStartUploadButtonClick}
        />
      )}
      {isUploadStarted && (
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
      )}
    </Container>
  );
};
