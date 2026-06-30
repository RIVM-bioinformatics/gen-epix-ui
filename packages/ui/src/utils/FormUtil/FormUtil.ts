import type {
  DeepRequired,
  FieldErrorsImpl,
  FieldValues,
} from 'react-hook-form';
import {
  format,
  isValid,
  parseISO,
} from 'date-fns';
import type { TFunction } from 'i18next';
import type { ObjectSchema } from 'yup';
import {
  array,
  boolean,
  number,
  object,
  string,
} from 'yup';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { ObjectUtil } from '../ObjectUtil';
import { DATE_FORMAT } from '../../data/date';

export class FormUtil {
  public static createBooleanOptions(t: TFunction<'translation', undefined>): { label: string; value: boolean }[] {
    return [
      { label: t`Yes`, value: true }, // t`Yes`
      { label: t`No`, value: false }, // t`No`
    ];
  }

  public static createFormValues<TFormFields extends FieldValues, TData = TFormFields>(formFieldDefinitions: FormFieldDefinition<TFormFields>[], item: TData): TFormFields {
    const itemValues: { [key: string]: unknown } = {};
    formFieldDefinitions.forEach(formFieldDefinition => {
      switch (formFieldDefinition.definition) {
        case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        case FORM_FIELD_DEFINITION_TYPE.SELECT:
          if (formFieldDefinition.multiple) {
            itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? [] as TFormFields[keyof TFormFields];
          } else {
            itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? null;
          }
          break;
        case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
          itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? '';
          break;
        case FORM_FIELD_DEFINITION_TYPE.DATE:
          try {
            const dateValue = parseISO(item?.[formFieldDefinition.name as unknown as keyof typeof item] as string);
            itemValues[formFieldDefinition.name] = isValid(dateValue) ? dateValue : null;
          } catch (_error) {
            itemValues[formFieldDefinition.name] = null;
          }
          break;
        case FORM_FIELD_DEFINITION_TYPE.NUMBER:
          itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? null;
          break;
        case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
          itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? [] as TFormFields[keyof TFormFields];
          break;
        default:
          break;
      }
    });
    return itemValues as unknown as TFormFields;
  }

  public static createStringValuesFromFormValues<TFormFields extends FieldValues>(formFieldDefinitions: FormFieldDefinition<TFormFields>[], formValues: TFormFields): { [key: string]: string } {
    const content: { [key: string]: string } = {};
    formFieldDefinitions.forEach(formFieldDefinition => {
      const value = formValues[formFieldDefinition.name];
      switch (formFieldDefinition.definition) {
        case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        case FORM_FIELD_DEFINITION_TYPE.NUMBER:
        case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        case FORM_FIELD_DEFINITION_TYPE.SELECT:
        case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
        case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
          content[formFieldDefinition.name] = value;
          break;
        case FORM_FIELD_DEFINITION_TYPE.DATE:
          try {
            const dateValue = parseISO(value as unknown as string);
            content[formFieldDefinition.name] = isValid(dateValue) ? format(dateValue, formFieldDefinition.dateFormat ?? DATE_FORMAT.DATE) : null;
          } catch (_error) {
            content[formFieldDefinition.name] = null;
          }
          break;
        default:
          break;
      }
    });
    return ObjectUtil.deepRemoveEmptyStrings(content);
  }

  public static createYupSchemaFromFormFieldDefinitions<TFormFields extends FieldValues>(formFieldDefinitions: FormFieldDefinition<TFormFields>[]): ObjectSchema<{ [key: string]: string }> {
    return formFieldDefinitions.reduce((s, fieldDefinition) => {
      switch (fieldDefinition.definition) {
        case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
          if (fieldDefinition.multiple) {
            return s.concat(object().shape({
              [fieldDefinition.name]: array().of(string().nullable()).nullable().transform((_val: unknown, orig: unknown[]) => orig?.length ? orig : null),
            }));
          }
          return s.concat(object().shape({
            [fieldDefinition.name]: string().nullable().transform((_val: unknown, orig: string) => orig || null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
          return s.concat(object().shape({
            [fieldDefinition.name]: boolean().nullable().transform((_val: unknown, orig: unknown) => orig ?? null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.DATE:
          return s.concat(object().shape({
            [fieldDefinition.name]: string().nullable().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.FILE:
          return s;
        case FORM_FIELD_DEFINITION_TYPE.HIDDEN:
        case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
          return s.concat(object().shape({
            [fieldDefinition.name]: string().nullable().transform((_val: unknown, orig: string) => orig || null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.NUMBER:
          return s.concat(object().shape({
            [fieldDefinition.name]: number().nullable().transform((_val: unknown, orig: unknown) => orig ?? null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP:
          return s.concat(object().shape({
            [fieldDefinition.name]: string().nullable().transform((_val: unknown, orig: string) => orig || null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.SELECT:
          if (fieldDefinition.multiple) {
            return s.concat(object().shape({
              [fieldDefinition.name]: array().of(string().nullable()).nullable().transform((_val: unknown, orig: unknown[]) => orig?.length ? orig : null),
            }));
          }
          return s.concat(object().shape({
            [fieldDefinition.name]: string().nullable().transform((_val: unknown, orig: string) => orig || null),
          }));
        case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
          return s.concat(object().shape({
            [fieldDefinition.name]: array().of(string().nullable()).nullable().transform((_val: unknown, orig: unknown[]) => orig?.length ? orig : null),
          }));
        default:
          return s;
      }
    }, object({}));
  }

  public static getFieldErrorMessage<TFormFields extends FieldValues>(fieldErrors: Partial<FieldErrorsImpl<DeepRequired<TFormFields>>>, fieldName: string): string {
    const fieldError = fieldErrors?.[fieldName];
    return fieldError?.message as string || null;
  }
}
