import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  FormControl,
  FormHelperText,
  FormLabel,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  FieldValues,
  Path,
  UseControllerReturn,
} from 'react-hook-form';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { FileDropZone } from '@gen-epix/ui-core-components/components/FileDropZone';

import { FormUtil } from '../../../utils/FormUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type FileUploadProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly accept: string;
  readonly disabled?: boolean;
  readonly infoMessage?: string;
  readonly label: string;
  readonly loading?: boolean; // NOT implemented
  readonly multiple?: boolean;
  readonly name: TName;
  readonly onChange?: (value: FileList) => void;
  readonly required?: boolean;
  readonly warningMessage?: string;
};

export const FileUpload = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  accept,
  disabled,
  infoMessage,
  label,
  multiple = false,
  name,
  onChange: onChangeProp,
  required,
  warningMessage,
}: FileUploadProps<TFieldValues, TName>): ReactElement => {
  const labelId = useId();
  const helperTextId = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const hasError = !!errorMessage;

  const onFilesSelected = useCallback((onChange: UseControllerReturn<TFieldValues, TName>['field']['onChange']) =>
    (files: FileList) => {
      if (onChangeProp) {
        onChangeProp(files);
      }
      onChange(files);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        dropZoneRef?.current?.focus();
      },
    });
    return (
      <FileDropZone
        accept={accept}
        ariaDescribedBy={helperTextId}
        disabled={disabled}
        error={hasError}
        files={value ?? null}
        label={label}
        labelledById={labelId}
        multiple={multiple}
        onBlur={onBlur}
        onFilesSelected={onFilesSelected(onChange)}
        ref={dropZoneRef}
      />
    );
  }, [accept, helperTextId, disabled, hasError, label, labelId, multiple, onFilesSelected]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('UploadButton', { label, name })}
      fullWidth
    >
      <FormLabel
        component={'legend'}
        id={labelId}
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
      <FormHelperText
        id={helperTextId}
        sx={{ ml: 0 }}
      >
        <FormFieldHelperText
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          noIndent
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
