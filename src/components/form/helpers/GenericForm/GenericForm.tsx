import type {
  FormEventHandler,
  ReactElement,
} from 'react';
import {
  useMemo,
  useCallback,
  Fragment,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Path,
  UseFormReturn,
} from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { Box } from '@mui/material';
import type { ObjectSchema } from 'yup';

import type { FormFieldDefinition } from '../../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { RichTextEditor } from '../../fields/RichTextEditor';
import { TransferList } from '../../fields/TransferList';
import type { AutocompleteProps } from '../../fields/Autocomplete';
import { Autocomplete } from '../../fields/Autocomplete';
import type { SelectProps } from '../../fields/Select';
import { Select } from '../../fields/Select';
import { TextField } from '../../fields/TextField';
import { DatePicker } from '../../fields/DatePicker';
import { UploadButton } from '../../fields/UploadButton/UploadButton';
import { RadioGroup } from '../../fields/RadioGroup';
import { useIsFormFieldRequiredFromSchema } from '../../../../hooks/useIsFormFieldRequiredFromSchema';

export type GenericFormProps<TFormFields> = {
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly formId?: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly formMethods: UseFormReturn<TFormFields>;
  readonly renderField?: (definition: FormFieldDefinition<TFormFields>, element: ReactElement) => ReactElement;
  readonly wrapForm?: (children: ReactElement) => ReactElement;
  readonly disableAll?: boolean;
  readonly schema: ObjectSchema<TFormFields, TFormFields>;
  readonly defaultFormValues?: Partial<TFormFields>;
};

export const GenericForm = <TFormFields,>({
  formFieldDefinitions,
  formId,
  onSubmit,
  formMethods,
  renderField,
  wrapForm,
  disableAll,
  schema,
}: GenericFormProps<TFormFields>) => {
  const [t] = useTranslation();

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  const isFormFieldRequired = useIsFormFieldRequiredFromSchema(schema, formMethods.getValues);

  const renderFormFieldDefinition = useCallback((formFieldDefinition: FormFieldDefinition<TFormFields>) => {
    switch (formFieldDefinition.definition) {
      case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        return (
          <Autocomplete
            {...formFieldDefinition as AutocompleteProps<TFormFields, Path<TFormFields>, false>}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.SELECT:
        return (
          <Select
            {...formFieldDefinition as SelectProps<TFormFields, Path<TFormFields>, false>}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
        return (
          <TransferList
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        return (
          <Select
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
            options={booleanOptions}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.DATE:
        return (
          <DatePicker
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        return (
          <RichTextEditor
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.FILE:
        return (
          <UploadButton
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP:
        return (
          <RadioGroup
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
        return (
          <TextField
            {...formFieldDefinition}
            required={isFormFieldRequired(formFieldDefinition.name)}
            disabled={disableAll ?? formFieldDefinition.disabled}
          />
        );
      default:
        throw Error(`Unsupported form field definition: ${formFieldDefinition.definition}`);
    }
  }, [booleanOptions, disableAll, isFormFieldRequired]);


  const formContent = (
    <>
      {formFieldDefinitions.map(formFieldDefinition => {
        if (renderField) {
          return (
            <Fragment key={formFieldDefinition.name}>
              {renderField(formFieldDefinition, renderFormFieldDefinition(formFieldDefinition))}
            </Fragment>
          );
        }
        return (
          <Box
            key={formFieldDefinition.name}
            marginY={1}
          >
            {renderFormFieldDefinition(formFieldDefinition)}
          </Box>
        );
      })}
    </>
  );

  return (
    <FormProvider {...formMethods}>
      <Box
        component={'form'}
        autoComplete={'off'}
        id={formId}
        onSubmit={onSubmit}
      >
        {wrapForm ? wrapForm(formContent) : formContent}
      </Box>
    </FormProvider>
  );
};
