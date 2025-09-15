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
  FormControl,
  FormLabel,
  FormHelperText,
  Button,
  styled,
  Box,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  UseControllerReturn,
  FieldValues,
  Path,
  ControllerRenderProps,
} from 'react-hook-form';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type UploadButtonProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly multiple?: boolean;
  readonly accept: string;
  readonly loading?: boolean; // NOT implemented
};

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export const UploadButton = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  name,
  required,
  warningMessage,
  multiple = false,
  accept,
  onChange: onChangeProp,
}: UploadButtonProps<TFieldValues, TName>): ReactElement => {
  const [t] = useTranslation();
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasError = !!errorMessage;

  const onInputChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onChangeProp) {
        onChangeProp(event.target.files as TFieldValues[TName]);
      }
      onChange(event.target.files);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        buttonRef?.current?.focus();
      },
    });
    return (
      <>
        <Button
          component={'label'}
          // ref={buttonRef}
          disabled={disabled}
          role={undefined}
          variant={'outlined'}
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          onBlur={onBlur}
        >
          {multiple ? t('Upload files ({{accept}})', { accept: accept.split(',').join(', ') }) : t('Upload file ({{accept}})', { accept: accept.split(',').join(', ') })}
          <VisuallyHiddenInput
            accept={accept}
            multiple={multiple}
            type={'file'}
            onChange={onInputChange(onChange)}
          />
        </Button>
        {value && (
          <Box>
            {Array.from(value as unknown as FileList).map((file) => file.name).join(', ')}
          </Box>
        )}
      </>
    );
  }, [accept, disabled, multiple, onInputChange, t]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('UploadButton', { label, name: name as string })}
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
          noIndent
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
