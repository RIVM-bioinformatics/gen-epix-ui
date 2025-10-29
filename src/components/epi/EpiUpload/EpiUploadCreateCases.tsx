import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useContext,
  useEffect,
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

import { Spinner } from '../../ui/Spinner';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import {
  CaseApi,
  type CaseReadSet,
} from '../../../api';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadCreateCases = () => {
  const [t] = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const reset = useStore(store, (state) => state.reset);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const sequenceMapping = useStore(store, (state) => state.sequenceMapping);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const rawData = useStore(store, (state) => state.rawData);

  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const abort = () => {
      abortController.abort();
    };

    if (!isUploadStarted) {
      return abort;
    }

    const uploadCases = async () => {
      try {
        await CaseApi.instance.createCases({
          case_type_id: store.getState().caseTypeId,
          created_in_data_collection_id: store.getState().createdInDataCollectionId,
          data_collection_ids: store.getState().shareInDataCollectionIds,
          is_update: store.getState().importAction === EPI_UPLOAD_ACTION.UPDATE,
          cases: validatedCases.map(c => c.case),
        }, { signal });

        const readSetsForCases: Array<{ caseReadSet: CaseReadSet; file: File }> = [];

        for (const [caseId, mapping] of Object.entries(sequenceMapping)) {
          for (const [columnId, fileName] of Object.entries(mapping.sequenceFileNames)) {
            const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileName);
            if (file) {
              readSetsForCases.push({
                caseReadSet: {
                  case_id: caseId,
                  case_type_col_id: columnId,
                  library_prep_protocol_id: '',
                },
                file,
              });
            }
          }
        }

      } catch (e) {
        setError(e);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    uploadCases();

    return abort;
  }, [isUploadStarted, sequenceFilesDataTransfer.files, sequenceMapping, store, validatedCases]);


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

  if (isUploadStarted && !error) {
    return <Spinner label={t`Uploading cases...`} />;
  }
  if (error) {
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
            {t('Successfully uploaded cases.')}
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
