import type { CaseDbCase } from '@gen-epix/api-casedb';
import { Button } from '@mui/material';
import { Box } from '@mui/system';

export type EpiDashboardEditCasesProps = {
  cases: CaseDbCase[];
  onClose: () => void;
};

export const EpiDashboardEditCases = ({ cases: _cases, onClose }: EpiDashboardEditCasesProps) => {
  return (
    <Box>
      {'Editing cases...'}
      <Box>
        <Button onClick={onClose}>
          {'Close'}
        </Button>
      </Box>
    </Box>
  );
};
