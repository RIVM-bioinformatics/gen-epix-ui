import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  FormControl,
  IconButton,
  FormGroup,
  FormHelperText,
  FormLabel,
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
  UseControllerReturn,
  PathValue,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { FormFieldBaseProps } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

import { useRichTextEditorExtensions } from './useRichTextEditorExtensions';

export interface RichTextEditorProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName> {
  readonly loading?: boolean;
}

export const RichTextEditor = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  label,
  name,
  disabled,
  onChange: onChangeProp,
  required,
  loading,
  warningMessage,
}: RichTextEditorProps<TFieldValues, TName>): ReactElement => {
  const [t] = useTranslation();
  const theme = useTheme();
  const extensions = useRichTextEditorExtensions({
    placeholder: '',
  });
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const rteRef = useRef<RichTextEditorRef>(null);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
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
            <RichTextEditorComponent
              RichTextFieldProps={{
                // The "outlined" variant is the default (shown here only as
                // example), but can be changed to "standard" to remove the outlined
                // field border from the editor
                variant: 'outlined',
              }}
              content={value}
              extensions={extensions}
              ref={rteRef}
              // eslint-disable-next-line react/jsx-no-bind
              renderControls={() => (
                <MenuControlsContainer>
                  <MenuDivider />
                  <MenuSelectHeading />
                  <MenuDivider />
                  <MenuSelectFontSize />
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
                      { value: '#000000', label: 'Black' },
                      { value: '#ffffff', label: 'White' },
                      { value: '#888888', label: 'Grey' },
                      { value: '#ff0000', label: 'Red' },
                      { value: '#ff9900', label: 'Orange' },
                      { value: '#ffff00', label: 'Yellow' },
                      { value: '#00d000', label: 'Green' },
                      { value: '#0000ff', label: 'Blue' },
                    ]}
                  />
                  <MenuButtonHighlightColor
                    swatchColors={[
                      { value: '#595959', label: 'Dark grey' },
                      { value: '#dddddd', label: 'Light grey' },
                      { value: '#ffa6a6', label: 'Light red' },
                      { value: '#ffd699', label: 'Light orange' },
                      // Plain yellow matches the browser default `mark` like when using Cmd+Shift+H
                      { value: '#ffff00', label: 'Yellow' },
                      { value: '#99cc99', label: 'Light green' },
                      { value: '#90c6ff', label: 'Light blue' },
                      { value: '#8085e9', label: 'Light purple' },
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
                      viewLinkEditButtonLabel: t`Edit link`,
                      viewLinkRemoveButtonLabel: t`Remove link`,
                      editLinkAddTitle: t`Add new link`,
                      editLinkEditTitle: t`Update this link`,
                      editLinkCancelButtonLabel: t`Cancel changes`,
                      editLinkTextInputLabel: t`Text content`,
                      editLinkHrefInputLabel: t`URL`,
                      editLinkSaveButtonLabel: t`Save changes`,
                    }}

                  />
                  <TableBubbleMenu
                    labels={{
                      insertColumnBefore: t`Insert column before`,
                      insertColumnAfter: t`Insert column after`,
                      deleteColumn: t`Delete column`,
                      insertRowAbove: t`Insert row above`,
                      insertRowBelow: t`Insert row below`,
                      deleteRow: t`Delete row`,
                      mergeCells: t`Merge cells`,
                      splitCell: t`Split cell`,
                      toggleHeaderRow: t`Toggle header row`,
                      toggleHeaderColumn: t`Toggle header column`,
                      toggleHeaderCell: t`Toggle header cell`,
                      deleteTable: t`Delete table`,
                    }}
                  />
                </>
              )}
            </RichTextEditorComponent>
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
