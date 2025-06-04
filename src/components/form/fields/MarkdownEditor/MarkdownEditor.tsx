import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import {
  FormControl,
  IconButton,
  FormLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  ControllerRenderProps,
  UseControllerReturn,
  PathValue,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';

import type { FormFieldBaseProps } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export interface MarkdownEditorProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName> {
  readonly loading?: boolean;
}

export const MarkdownEditor = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  label,
  name,
  disabled,
  onChange: onChangeProp,
  required,
  loading,
  warningMessage,
}: MarkdownEditorProps<TFieldValues, TName>): ReactElement => {
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const inputRef = useRef<HTMLInputElement>(null);

  const onMDEditorChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (value?: string, _event?: ChangeEvent<HTMLTextAreaElement>) => {
      if (onChangeProp) {
        onChangeProp(value);
      }
      onChange(value);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange('');
    };

    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('CheckboxGroup', { label, name: name as string })}
        fullWidth
        sx={{
          'legend button': {
            display: 'none',
          },
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
        }}
      >
        <FormLabel
          component={'legend'}
          disabled={disabled || loading}
          id={id}
          required={required}

        >
          {label}
          <IconButton
            {...TestIdUtil.createAttributes('DateRangePicker-reset')}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={onResetButtonClick}
            sx={{
              position: 'absolute',
              top: '-10px',
              '& svg': {
                fontSize: '16px',
              },
            }}
            tabIndex={-1}
          >
            <ClearIcon />
          </IconButton>
        </FormLabel>
        { !loading && (
          <FormGroup
            aria-labelledby={id}
            onBlur={onBlur}
          >
            <MDEditor
              onBlur={onBlur}
              onChange={onMDEditorChange(onChange)}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              ref={inputRef}
              value={value}
            />
          </FormGroup>
        )}
        { loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );


  }, [disabled, errorMessage, hasError, id, label, loading, name, onMDEditorChange, required, warningMessage]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />
  );
};
