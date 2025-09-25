import { Box } from '@mui/material';
import { useCallback } from 'react';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadSelectSequenceFilesProps = {
  readonly onProceed: (fileList: FileList) => void;
  readonly onGoBack: () => void;
};

export const EpiUploadSelectSequenceFiles = ({ onProceed, onGoBack }: EpiUploadSelectSequenceFilesProps) => {
  const onProceedButtonClick = useCallback(() => {
    onProceed(null);
  }, [onProceed]);

  return (
    <Box>
      <EpiUploadNavigation
        container
        onGoBackButtonClick={onGoBack}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
