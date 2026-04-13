import {
  Box,
  type BoxProps,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CaseSet } from '@gen-epix/api-casedb';

import { RichTextEditorContent } from '../../form/fields/RichTextEditor';

export type EpiCaseSetDescriptionProps = {
  readonly caseSet: CaseSet;
} & BoxProps;
export const EpiCaseSetDescription = ({ caseSet, ...boxProps }: EpiCaseSetDescriptionProps) => {
  const { t } = useTranslation();
  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Description`}
      </Typography>
      <Box>
        {caseSet?.description && (
          <RichTextEditorContent source={caseSet?.description || ''} />
        )}
        {!caseSet?.description && (
          <Box sx={{ fontStyle: 'italic' }}>
            {t`None`}
          </Box>
        )}
      </Box>
    </Box>
  );

};
