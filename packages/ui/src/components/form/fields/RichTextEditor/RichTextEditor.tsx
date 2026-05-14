import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  Alert,
  AlertTitle,
  FormControl,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type { RichTextEditorRef } from 'mui-tiptap';
import {
  isTouchDevice,
  LinkBubbleMenu,
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonSubscript,
  MenuButtonSuperscript,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUndo,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectFontSize,
  MenuSelectHeading,
  MenuSelectTextAlign,
  RichTextEditor as RichTextEditorComponent,
  TableBubbleMenu,
} from 'mui-tiptap';
import type {
  FieldValues,
  Path,
  PathValue,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

import { useRichTextEditorExtensions } from './useRichTextEditorExtensions';

export type RichTextEditorProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const RichTextEditor = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  loading,
  name,
  onChange: onChangeProp,
  required,
  warningMessage,
}: RichTextEditorProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const extensions = useRichTextEditorExtensions({
    placeholder: '',
  });
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const rteRef = useRef<RichTextEditorRef>(null);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    rteRef.current?.editor.on('blur', () => onBlur());
    rteRef.current?.editor.on('update', () => {
      const newValue = rteRef.current?.editor.getHTML();
      if (newValue === value) {
        return;
      }
      if (onChangeProp) {
        onChangeProp(newValue);
      }
      onChange(newValue);
    });
    ref({
      focus: () => {
        rteRef.current?.editor.commands.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange('');
    };

    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('CheckboxGroup', { label, name })}
        fullWidth
        sx={{
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
          'legend button': {
            display: 'none',
          },
        }}
      >
        {!disabled && (
          <Alert
            severity={'info'}
            sx={{ mt: 0.5 }}
          >
            <AlertTitle>
              {t`Privacy notice`}
            </AlertTitle>
            {t`Do not enter any personal information here (such as name, address, telephone number or government-issued personal identifier).`}
          </Alert>
        )}
        <FormLabel
          component={'legend'}
          disabled={disabled || loading}
          id={id}
          required={required}

        >
          {label}
          {!disabled && (
            <IconButton
              {...TestIdUtil.createAttributes('DateRangePicker-reset')}
              aria-label={t`Clear rich text editor content`}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onClick={onResetButtonClick}
              sx={{
                '& svg': {
                  fontSize: '16px',
                },
                position: 'absolute',
                top: '-10px',
              }}
              tabIndex={-1}
            >
              <ClearIcon />
            </IconButton>
          )}
        </FormLabel>
        { !loading && (
          <FormGroup
            aria-labelledby={id}
            onBlur={onBlur}
          >
            <RichTextEditorComponent
              content={value}
              editable={!disabled}
              extensions={extensions}
              ref={rteRef}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              renderControls={() => (
                <MenuControlsContainer>
                  <MenuDivider />
                  <FormControl>
                    <MenuSelectHeading />
                  </FormControl>
                  <MenuDivider />
                  <FormControl>
                    <MenuSelectFontSize />
                  </FormControl>
                  <MenuDivider />
                  <MenuButtonBold />
                  <MenuButtonItalic />
                  <MenuButtonUnderline />
                  <MenuButtonStrikethrough />
                  <MenuButtonSubscript />
                  <MenuButtonSuperscript />
                  <MenuDivider />
                  <MenuButtonTextColor
                    defaultTextColor={theme.palette.text.primary}
                    swatchColors={[
                      { label: 'Black', value: '#000000' },
                      { label: 'White', value: '#ffffff' },
                      { label: 'Grey', value: '#888888' },
                      { label: 'Red', value: '#ff0000' },
                      { label: 'Orange', value: '#ff9900' },
                      { label: 'Yellow', value: '#ffff00' },
                      { label: 'Green', value: '#00d000' },
                      { label: 'Blue', value: '#0000ff' },
                    ]}
                  />
                  <MenuButtonHighlightColor
                    swatchColors={[
                      { label: 'Dark grey', value: '#595959' },
                      { label: 'Light grey', value: '#dddddd' },
                      { label: 'Light red', value: '#ffa6a6' },
                      { label: 'Light orange', value: '#ffd699' },
                      // Plain yellow matches the browser default `mark` like when using Cmd+Shift+H
                      { label: 'Yellow', value: '#ffff00' },
                      { label: 'Light green', value: '#99cc99' },
                      { label: 'Light blue', value: '#90c6ff' },
                      { label: 'Light purple', value: '#8085e9' },
                    ]}
                  />
                  <MenuDivider />
                  <MenuButtonEditLink />
                  <MenuDivider />
                  <MenuSelectTextAlign />
                  <MenuDivider />
                  <MenuButtonOrderedList />
                  <MenuButtonBulletedList />
                  <MenuButtonTaskList />
                  {isTouchDevice() && (
                    <>
                      <MenuButtonIndent />
                      <MenuButtonUnindent />
                    </>
                  )}
                  <MenuDivider />
                  <MenuButtonBlockquote />
                  <MenuDivider />
                  <MenuButtonHorizontalRule />
                  <MenuButtonAddTable />
                  <MenuDivider />
                  <MenuButtonRemoveFormatting />
                  <MenuDivider />
                  <MenuButtonUndo />
                  <MenuButtonRedo />
                </MenuControlsContainer>
              )}
              RichTextFieldProps={{
                // The "outlined" variant is the default (shown here only as
                // example), but can be changed to "standard" to remove the outlined
                // field border from the editor
                variant: 'outlined',
              }}
              sx={{
                '& .ProseMirror': {
                  whiteSpace: 'pre-wrap',
                },
              }}
            >
              {() => (
                <>
                  <LinkBubbleMenu
                    labels={{
                      editLinkAddTitle: t`Add new link`,
                      editLinkCancelButtonLabel: t`Cancel changes`,
                      editLinkEditTitle: t`Update this link`,
                      editLinkHrefInputLabel: t`URL`,
                      editLinkSaveButtonLabel: t`Save changes`,
                      editLinkTextInputLabel: t`Text content`,
                      viewLinkEditButtonLabel: t`Edit link`,
                      viewLinkRemoveButtonLabel: t`Remove link`,
                    }}

                  />
                  <TableBubbleMenu
                    labels={{
                      deleteColumn: t`Delete column`,
                      deleteRow: t`Delete row`,
                      deleteTable: t`Delete table`,
                      insertColumnAfter: t`Insert column after`,
                      insertColumnBefore: t`Insert column before`,
                      insertRowAbove: t`Insert row above`,
                      insertRowBelow: t`Insert row below`,
                      mergeCells: t`Merge cells`,
                      splitCell: t`Split cell`,
                      toggleHeaderCell: t`Toggle header cell`,
                      toggleHeaderColumn: t`Toggle header column`,
                      toggleHeaderRow: t`Toggle header row`,
                    }}
                  />
                </>
              )}
            </RichTextEditorComponent>
          </FormGroup>
        )}
        { !!loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );


  }, [disabled, errorMessage, extensions, hasError, id, label, loading, name, onChangeProp, required, t, theme.palette.text.primary, warningMessage]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />
  );
};
