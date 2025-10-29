import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import {
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import { FileSelector } from '../../ui/FileSelector';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadSelectSequenceFiles = () => {
  const [t] = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setSequenceFilesDataTransfer = useStore(store, (state) => state.setSequenceFilesDataTransfer);
  const initialDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const dataTransfer = useRef(initialDataTransfer);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const caseTypeSupportsUploadingSequences = useMemo(() => {
    return completeCaseTypeColumnStats.sequenceColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const caseTypeSupportsUploadingReads = useMemo(() => {
    return completeCaseTypeColumnStats.readsColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const importDataSupportsUploadingSequences = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.sequenceColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const importDataSupportsUploadingReads = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.readsColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const canUploadSequences = caseTypeSupportsUploadingSequences && importDataSupportsUploadingSequences;
  const canUploadReads = caseTypeSupportsUploadingReads && importDataSupportsUploadingReads;

  const accept = useMemo(() => {
    let acc = '';
    if (canUploadSequences) {
      acc += '.fa,.fasta,.fa.gz,.fasta.gz,';
    }
    if (canUploadReads) {
      acc += '.fq,.fastq,.fq.gz,.fastq.gz,';
    }
    return acc;
  }, [canUploadReads, canUploadSequences]);

  const canUpload = useMemo(() => {
    return (canUploadSequences) || (canUploadReads);
  }, [canUploadSequences, canUploadReads]);

  const onProceedButtonClick = useCallback(async () => {
    setSequenceFilesDataTransfer(dataTransfer.current);
    await goToNextStep();
  }, [goToNextStep, setSequenceFilesDataTransfer]);

  const onDataTransferChange = useCallback((dt: DataTransfer) => {
    dataTransfer.current = dt;

    // Note: setState in a timeout to avoid React state update during rendering warning
    setTimeout(() => {
      setSequenceFilesDataTransfer(dataTransfer.current);
    });
  }, [setSequenceFilesDataTransfer]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
        position: 'relative',
      }}
    >
      {!canUpload && (
        <>
          <Alert severity={'info'}>
            <AlertTitle>
              {t('Uploading of sequences or read files is not supported.')}
            </AlertTitle>
            {t`The selected case type does not support uploading sequences or read files, or the imported data does not contain any mapped columns that support uploading of sequences or read files.`}
          </Alert>
          <Box />
        </>
      )}
      {canUpload && (
        <>
          <Box>
            {!canUploadSequences && (
              <Box marginY={2}>
                <Alert severity={'info'}>
                  <AlertTitle>
                    {t('Uploading of sequences has been disabled.')}
                  </AlertTitle>
                  {!caseTypeSupportsUploadingSequences && (
                    <Box>
                      {t('Uploading of sequences is not supported for the selected case type.')}
                    </Box>
                  )}
                  {!importDataSupportsUploadingSequences && (
                    <Box>
                      {t('Uploading of sequences is not supported for the imported data.')}
                    </Box>
                  )}
                </Alert>
              </Box>
            )}
            {!canUploadReads && (
              <Box marginY={2}>
                <Alert severity={'info'}>
                  <AlertTitle>
                    {t('Uploading of read files has been disabled.')}
                  </AlertTitle>
                  {!caseTypeSupportsUploadingReads && (
                    <Box>
                      {t('Uploading of read files is not supported for the selected case type.')}
                    </Box>
                  )}
                  {!importDataSupportsUploadingReads && (
                    <Box>
                      {t('Uploading of read files is not supported for the imported data.')}
                    </Box>
                  )}
                </Alert>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: '100%',
              }}
            >
              <FileSelector
                initialDataTransfer={initialDataTransfer}
                accept={accept}
                numFilesAllowed={Infinity}
                onDataTransferChange={onDataTransferChange}
              />
            </Box>
          </Box>
        </>
      )}
      <EpiUploadNavigation
        proceedLabel={!canUpload ? t`Proceed` : undefined}
        onGoBackButtonClick={goToPreviousStep}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
