import type { RefObject } from 'react';
import type { InputAdornmentProps } from '@mui/material';
import {
  IconButton,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';

import { TestIdUtil } from '../../../../utils/TestIdUtil';

export type DatePickerInputAdornmentProps = {
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly onResetButtonClickRef: RefObject<() => void>;
} & InputAdornmentProps;

export const DatePickerInputAdornment = ({
  children,
  disabled,
  loading,
  onResetButtonClickRef,
  ...props
}: DatePickerInputAdornmentProps) => {
  const { t } = useTranslation();
  return (
    <InputAdornment {...props}>
      {!disabled && !loading && (
        <IconButton
          {...TestIdUtil.createAttributes('DatePicker-reset')}
          aria-label={t`Clear date field`}
          className={'DatePicker-resetButton'}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={() => onResetButtonClickRef.current()}
          sx={{
            '& svg': {
              fontSize: '16px',
            },
          }}
          tabIndex={-1}
        >
          <ClearIcon />
        </IconButton>
      )}
      {children}
    </InputAdornment>
  );
};
