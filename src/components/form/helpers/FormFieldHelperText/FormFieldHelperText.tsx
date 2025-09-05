import type {
  SxProps,
  Theme,
} from '@mui/material';
import {
  FormHelperText,
  Box,
  useTheme,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/WarningAmber';
import type { ReactElement } from 'react';

import { TestIdUtil } from '../../../../utils/TestIdUtil';

export type FormFieldHelperTextProps = {
  readonly errorMessage?: string;
  readonly warningMessage?: string | boolean;
  readonly noIndent?: boolean;
};

const iconStyle: SxProps<Theme> = {
  width: '13px',
  height: '13px',
  top: '3px',
  position: 'relative',
  marginRight: '1px',
};

export const FormFieldHelperText = ({ errorMessage, warningMessage, noIndent }: FormFieldHelperTextProps): ReactElement => {
  const testIdAttributes = TestIdUtil.createAttributes('FormFieldHelperText');
  const theme = useTheme();

  if (errorMessage) {
    return (
      <FormHelperText
        {...testIdAttributes}
        error
        component={'span'}
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
