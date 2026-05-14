import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  styled,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  UseControllerReturn,
} from 'react-hook-form';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { WindowManager } from '../../../../classes/managers/WindowManager';

export type UploadButtonProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly accept: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean; // NOT implemented
  readonly multiple?: boolean;
  readonly name: TName;
  readonly onChange?: (value: FileList) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

const VisuallyHiddenInput = styled('input')({
  bottom: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
});

export const UploadButton = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  accept,
  disabled,
  label,
  multiple = false,
  name,
  onChange: onChangeProp,
  required,
  warningMessage,
}: UploadButtonProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const id = useId();
  const inputId = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasError = !!errorMessage;

  const onInputChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onChangeProp) {
        onChangeProp(event.target.files);
      }
      onChange(event.target.files);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        buttonRef?.current?.focus();
      },
    });
    const inputElement = WindowManager.getInstance().document.getElementById(inputId) as HTMLInputElement | null;
    if (!value && inputElement) {
      inputElement.value = '';
    }
    return (
      <>
        <Button
          component={'label'}
          // ref={buttonRef}
          disabled={disabled}
          onBlur={onBlur}
          role={undefined}
          size={'large'}
          startIcon={<CloudUploadIcon />}
          sx={{
            height: theme => theme.spacing(7),
          }}
          tabIndex={-1}
          variant={'outlined'}
        >
          {multiple ? t('Upload files ({{accept}})', { accept: accept.split(',').join(', ') }) : t('Upload file ({{accept}})', { accept: accept.split(',').join(', ') })}
          <VisuallyHiddenInput
            accept={accept}
            id={inputId}
            multiple={multiple}
            onChange={onInputChange(onChange)}
            type={'file'}
          />
        </Button>
        {value && (
          <Box>
            {Array.from(value as unknown as FileList).map((file) => file.name).join(', ')}
          </Box>
        )}
      </>
    );
  }, [accept, disabled, inputId, multiple, onInputChange, t]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('UploadButton', { label, name })}
      fullWidth
    >
      <FormLabel
        component={'legend'}
        id={id}
        required={required}
      >
        {label}
      </FormLabel>
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
      <FormHelperText sx={{ ml: 0 }}>
        <FormFieldHelperText
          errorMessage={errorMessage}
          noIndent
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
