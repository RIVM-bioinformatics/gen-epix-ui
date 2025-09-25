import { Box } from '@mui/material';
import { useCallback } from 'react';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadMapSequencesProps = {
  readonly onProceed: () => void;
  readonly onGoBack: () => void;
};

export const EpiUploadMapSequences = ({ onProceed, onGoBack }: EpiUploadMapSequencesProps) => {
  const onProceedButtonClick = useCallback(() => {
    onProceed();
  }, [onProceed]);

  return (
    <Box>
      <EpiUploadNavigation
        onGoBackButtonClick={onGoBack}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
