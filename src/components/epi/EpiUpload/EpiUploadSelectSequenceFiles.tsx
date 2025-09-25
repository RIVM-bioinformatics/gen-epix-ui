import { Box } from '@mui/material';
import {
  useCallback,
  useRef,
} from 'react';

import { FileSelector } from '../../ui/FileSelector';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadSelectSequenceFilesProps = {
  readonly initialDataTransfer?: DataTransfer;
  readonly onProceed: (dataTransfer: DataTransfer) => void;
  readonly onGoBack: () => void;
};

export const EpiUploadSelectSequenceFiles = ({
  onProceed,
  onGoBack,
  initialDataTransfer,
}: EpiUploadSelectSequenceFilesProps) => {
  const dataTransfer = useRef(initialDataTransfer);

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
        gridTemplateRows: 'auto max-content',
      }}
    >
      <FileSelector
        initialDataTransfer={initialDataTransfer}
        accept={'.fa,.fasta,.fa.gz,.fasta.gz,.fq,.fastq,.fq.gz,.fastq.gz'}
        numFilesAllowed={Infinity}
        onDataTransferChange={onDataTransferChange}
      />
      <EpiUploadNavigation
        onGoBackButtonClick={onGoBack}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
