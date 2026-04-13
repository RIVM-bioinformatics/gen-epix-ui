import type {
  SxProps,
  Theme,
} from '@mui/material';
import {
  Box,
  FormHelperText,
  useTheme,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/WarningAmber';
import type { ReactElement } from 'react';

import { TestIdUtil } from '../../../../utils/TestIdUtil';

export type FormFieldHelperTextProps = {
  readonly errorMessage?: string;
  readonly noIndent?: boolean;
  readonly warningMessage?: boolean | string;
};

const iconStyle: SxProps<Theme> = {
  height: '13px',
  marginRight: '1px',
  position: 'relative',
  top: '3px',
  width: '13px',
};

export const FormFieldHelperText = ({ errorMessage, noIndent, warningMessage }: FormFieldHelperTextProps): ReactElement => {
  const testIdAttributes = TestIdUtil.createAttributes('FormFieldHelperText');
  const theme = useTheme();

  if (errorMessage) {
    return (
      <FormHelperText
        {...testIdAttributes}
        component={'span'}
        error
        role={'alert'}
        sx={{
          marginLeft: noIndent ? 0 : theme.spacing(-2),
          position: 'relative',
        }}
      >
        <ErrorIcon sx={iconStyle} />
        {errorMessage}
      </FormHelperText>
    );
  } else if (warningMessage) {
    return (
      <Box
        {...testIdAttributes}
        className={'Mui-warning'}
        component={'span'}
        role={'alert'}
        sx={{
          marginLeft: noIndent ? 0 : theme.spacing(-2),
          position: 'relative',
        }}
      >
        <WarningIcon sx={iconStyle} />
        {warningMessage}
      </Box>
    );
  }
  return null;
};
