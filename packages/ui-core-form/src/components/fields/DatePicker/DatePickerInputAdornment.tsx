import type { InputAdornmentProps } from '@mui/material';
import {
  IconButton,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

export type DatePickerInputAdornmentProps = {
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly onResetButtonClick: () => void;
} & InputAdornmentProps;

export const DatePickerInputAdornment = ({
  children,
  disabled,
  loading,
  onResetButtonClick,
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

          onClick={onResetButtonClick}
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
