import { Box } from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  ColType,
  type CompleteCaseType,
  type ValidatedCase,
} from '../../../api';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadMapSequencesProps = {
  readonly onProceed: () => void;
  readonly onGoBack: () => void;
  readonly completeCaseType: CompleteCaseType;
  readonly validatedCases: ValidatedCase[];
  readonly sequenceFilesDataTransfer: DataTransfer;
};

export const EpiUploadMapSequences = ({ onProceed, onGoBack, validatedCases, sequenceFilesDataTransfer, completeCaseType }: EpiUploadMapSequencesProps) => {
  const [t] = useTranslation();
  const onProceedButtonClick = useCallback(() => {
    onProceed();
  }, [onProceed]);

  const completeCaseTypeIdColumns = useMemo(() => {
    const caseTypeColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.ID_ANONYMISED, ColType.ID_PSEUDONYMISED, ColType.ID_ANONYMISED]);
    return caseTypeColumns;
  }, [completeCaseType]);

  console.log({ completeCaseTypeIdsColumns: completeCaseTypeIdColumns, validatedCases, sequenceFilesDataTransfer });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto max-content',
      }}
    >
      <Box>
        {t`Work in progress...`}
      </Box>
      <EpiUploadNavigation
        onGoBackButtonClick={onGoBack}
        onProceedButtonClick={onProceedButtonClick}
      />
    </Box>
  );
};
