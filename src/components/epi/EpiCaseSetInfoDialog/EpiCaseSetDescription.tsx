import {
  Box,
  Typography,
  type BoxProps,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CaseSet } from '../../../api';
import { RichTextEditorContent } from '../../form/fields/RichTextEditor';

export type EpiCaseSetDescriptionProps = {
  readonly caseSet: CaseSet;
} & BoxProps;
export const EpiCaseSetDescription = ({ caseSet, ...boxProps }: EpiCaseSetDescriptionProps) => {
  const [t] = useTranslation();
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
