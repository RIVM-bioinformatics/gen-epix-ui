import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';

import { FileSelector } from '../../ui/FileSelector';
import type { CompleteCaseType } from '../../../api';
import type {
  EPI_UPLOAD_ACTION,
  EpiUploadMappedColumn,
} from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadSelectSequenceFilesProps = {
  readonly initialDataTransfer?: DataTransfer;
  readonly completeCaseType: CompleteCaseType;
  readonly rawData: string[][];
  readonly importAction: EPI_UPLOAD_ACTION;
  readonly mappedColumns?: EpiUploadMappedColumn[];
  readonly onProceed: (dataTransfer: DataTransfer) => void;
  readonly onGoBack: () => void;
};

export const EpiUploadSelectSequenceFiles = ({
  onProceed,
  onGoBack,
  initialDataTransfer,
  completeCaseType,
  mappedColumns,
}: EpiUploadSelectSequenceFilesProps) => {
  const [t] = useTranslation();
  const dataTransfer = useRef(initialDataTransfer);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const caseTypeSupportsUploadingSequences = useMemo(() => {
    return completeCaseTypeColumnStats.sequenceColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const caseTypeSupportsUploadingReads = useMemo(() => {
    return completeCaseTypeColumnStats.readsFwdRevColumnPairs.length > 0 || completeCaseTypeColumnStats.readsColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const importDataSupportsUploadingSequences = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.sequenceColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const importDataSupportsUploadingReads = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.readsFwdRevColumnPairs.flatMap(pair => [pair.fwd.id, pair.rev.id]).includes(mappedColumn.caseTypeCol.id))
      || mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.readsColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const canUploadSequences = caseTypeSupportsUploadingSequences && importDataSupportsUploadingSequences;
  const canUploadReads = caseTypeSupportsUploadingReads && importDataSupportsUploadingReads;

  console.log({ completeCaseTypeColumnStats });

  console.table({
    caseTypeSupportsUploadingSequences,
    caseTypeSupportsUploadingReads,
    importDataSupportsUploadingSequences,
    importDataSupportsUploadingReads,
    canUploadSequences,
    canUploadReads,
  });

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

  const onProceedButtonClick = useCallback(() => {
    onProceed(dataTransfer.current);
  }, [onProceed, dataTransfer]);

  const onDataTransferChange = useCallback((dt: DataTransfer) => {
    dataTransfer.current = dt;
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
      }}
    >
      {!canUpload && (
        <>
          <Alert severity={'info'}>
            <AlertTitle>
              {t('Nothing to upload')}
            </AlertTitle>
            {t`The selected case type does not support uploading of sequences or read files, or the imported data does not contain any mapped columns that support uploading of sequences or read files.`}
          </Alert>
          <Box />
        </>
      )}
      {canUpload && (
        <>
          <Box>
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {canUploadSequences ? t('Uploading of sequences is available') : t('Uploading of sequences has been disabled (not enough data).')}
                </AlertTitle>
              </Alert>
            </Box>
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {canUploadReads ? t('Uploading of read files is available') : t('Uploading of read files has been disabled (not enough data).')}
                </AlertTitle>
              </Alert>
            </Box>
          </Box>
          <FileSelector
            initialDataTransfer={initialDataTransfer}
            accept={accept}
            numFilesAllowed={Infinity}
            onDataTransferChange={onDataTransferChange}
          />
        </>
      )}
      <EpiUploadNavigation
        proceedLabel={!canUpload ? t`Proceed` : undefined}
        onGoBackButtonClick={onGoBack}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
