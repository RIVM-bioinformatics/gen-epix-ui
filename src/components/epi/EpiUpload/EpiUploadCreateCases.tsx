import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
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
import { useStore } from 'zustand';

import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';
import { LinearProgressWithLabel } from '../../ui/LinearProgressWithLabel';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadCreateCases = () => {
  const [t] = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const reset = useStore(store, (state) => state.reset);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const sequenceMapping = useStore(store, (state) => state.sequenceMapping);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const validatedCasesWithGeneratedId = useStore(store, (state) => state.validatedCasesWithGeneratedId);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const rawData = useStore(store, (state) => state.rawData);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const sequenceFileStats = useMemo(() => {
    return EpiUploadUtil.getSequenceMappingStats(sequenceMapping, sequenceFilesDataTransfer);
  }, [sequenceFilesDataTransfer, sequenceMapping]);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const abort = () => {
      abortController.abort();
    };

    if (!isUploadStarted) {
      return abort;
    }

    EpiUploadUtil.createCasesAndUploadFiles({
      caseTypeId: store.getState().caseTypeId,
      createdInDataCollectionId: store.getState().createdInDataCollectionId,
      importAction: store.getState().importAction,
      libraryPrepProtocolId: store.getState().libraryPrepProtocolId,
      mappedFileSize: sequenceFileStats.mappedFileSize,
      sequenceFilesDataTransfer,
      sequenceMapping,
      shareInDataCollectionIds: store.getState().shareInDataCollectionIds,
      signal,
      validatedCases,
      validatedCasesWithGeneratedId,
      onProgress: (percentage: number, message: string) => {
        setProgress(percentage);
        setProgressMessage(message);
      },
      onComplete: () => {
        setIsUploadCompleted(true);
      },
      onError: (e: Error) => {
        setError(e);
      },
    }).catch((e) => {
      if (!signal.aborted) {
        setError(e);
      }
    });

    return abort;
  }, [isUploadStarted, sequenceFileStats.mappedFileSize, sequenceFilesDataTransfer, sequenceMapping, store, t, validatedCases, validatedCasesWithGeneratedId]);


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

  let content: ReactNode;

  if (error) {
    content = (
      <Box>
        <GenericErrorMessage error={error} />
      </Box>
    );
  } else if (isUploadCompleted) {
    content = (
      <Box>
        <Box>
          <Alert severity={'success'}>
            <AlertTitle>
              {t('Upload completed.')}
            </AlertTitle>
          </Alert>
        </Box>
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
      </Box>
    );
  } else if (isUploadStarted) {
    content = (
      <Box>
        <Box marginBottom={4}>
          <Alert severity={'info'}>
            <AlertTitle>
              {t('Uploading cases and files.')}
            </AlertTitle>
            {t('Please wait while the cases and associated files are being uploaded. This may take a while depending on the number and size of the files being uploaded.')}
          </Alert>
        </Box>
        <Box
          marginTop={4}
          marginBottom={2}
        >
          <LinearProgressWithLabel value={progress} />
        </Box>
        <Box
          sx={{
            fontWeight: 700,
          }}
        >
          {progressMessage}
        </Box>
      </Box>
    );
  } else {
    content = (
      <Box>
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
        <EpiUploadNavigation
          proceedLabel={'Start upload'}
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onStartUploadButtonClick}
        />
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
      {content}
    </Container>
  );
};
