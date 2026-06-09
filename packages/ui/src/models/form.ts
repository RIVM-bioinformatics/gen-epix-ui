import type {
  FieldValues,
  Path,
} from 'react-hook-form';

import type { RichTextEditorProps } from '../components/form/fields/RichTextEditor';
import type { TransferListProps } from '../components/form/fields/TransferList';
import type { AutocompleteProps } from '../components/form/fields/Autocomplete';
import type { TextFieldProps } from '../components/form/fields/TextField';
import type { SelectProps } from '../components/form/fields/Select';
import type { DatePickerProps } from '../components/form/fields/DatePicker';
import type { UploadButtonProps } from '../components/form/fields/UploadButton/UploadButton';
import type { RadioGroupProps } from '../components/form/fields/RadioGroup';
import type { NumberFieldProps } from '../components/form/fields/NumberField';


export enum FORM_FIELD_DEFINITION_TYPE {
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  FILE = 'FILE',
  HIDDEN = 'HIDDEN',
  NUMBER = 'NUMBER',
  RADIO_GROUP = 'RADIO_GROUP',
  RICH_TEXT = 'RICH_TEXT',
  SELECT = 'SELECT',
  TEXTFIELD = 'TEXTFIELD',
  TRANSFER_LIST = 'TRANSFER_LIST',
}

export interface AutoCompleteOption<TValue = void> extends OptionBase<TValue extends void ? (number | string) : TValue> {
  groupBySortOrderValue?: number;
  groupByValue?: string;
}
export type CheckboxOption = OptionBase<number | string>;

export type FormFieldDefinition<TFormFields extends FieldValues> =
  FormFieldDefinitionAutocomplete<TFormFields> |
  FormFieldDefinitionAutocompleteMultiple<TFormFields> |
  FormFieldDefinitionBoolean<TFormFields> |
  FormFieldDefinitionDate<TFormFields> |
  FormFieldDefinitionFile<TFormFields> |
  FormFieldDefinitionHidden<TFormFields> |
  FormFieldDefinitionNumber<TFormFields> |
  FormFieldDefinitionRadioGroup<TFormFields> |
  FormFieldDefinitionRichText<TFormFields> |
  FormFieldDefinitionSelect<TFormFields> |
  FormFieldDefinitionSelectMultiple<TFormFields> |
  FormFieldDefinitionTextField<TFormFields> |
  FormFieldDefinitionTransferList<TFormFields>;

export type FormFieldDefinitionAutocomplete<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: false } & AutocompleteProps<TFormFields, Path<TFormFields>, false> & FormFieldGrouping;

export type FormFieldDefinitionAutocompleteMultiple<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: true } & AutocompleteProps<TFormFields, Path<TFormFields>, true> & FormFieldGrouping;
export type FormFieldDefinitionBoolean<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN } & FormFieldGrouping & Omit<SelectProps<TFormFields, Path<TFormFields>, false>, 'options'>;
export type FormFieldDefinitionDate<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.DATE } & DatePickerProps<TFormFields, Path<TFormFields>> & FormFieldGrouping;
export type FormFieldDefinitionFile<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.FILE } & FormFieldGrouping & UploadButtonProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionHidden<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.HIDDEN } & FormFieldGrouping & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionNumber<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER } & FormFieldGrouping & NumberFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionRadioGroup<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP } & FormFieldGrouping & RadioGroupProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionRichText<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT } & FormFieldGrouping & RichTextEditorProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionSelect<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.SELECT; multiple?: false } & FormFieldGrouping & SelectProps<TFormFields, Path<TFormFields>, false>;
export type FormFieldDefinitionSelectMultiple<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.SELECT; multiple?: true } & FormFieldGrouping & SelectProps<TFormFields, Path<TFormFields>, true>;
export type FormFieldDefinitionTextField<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD } & FormFieldGrouping & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionTransferList<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST } & FormFieldGrouping & TransferListProps<TFormFields, Path<TFormFields>>;
export type FormFieldGrouping = {
  groupKey?: string;
};
export type FormGroupDefinition = {
  description?: string;
  groupKey: string;
  label: string;
  messages?: FormGroupMessage[];
};
export type FormGroupMessage = {
  buttonLabel?: string;
  message: string;
  onButtonClick?: () => void;
  severity: 'error' | 'info' | 'warning';
};
export interface OptionBase<TValue> {
  disabled?: boolean;
  label?: string;
  value?: TValue;
}
export type RadioButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;
export type SelectOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;
export type ToggleButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;

export type TransferListOption = OptionBase<string>;
