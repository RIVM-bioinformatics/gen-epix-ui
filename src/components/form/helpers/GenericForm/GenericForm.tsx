import type { FormEventHandler } from 'react';
import {
  useMemo,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Path,
  UseFormReturn,
} from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { Box } from '@mui/material';

import type { FormFieldDefinition } from '../../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { RichTextEditor } from '../../fields/RichTextEditor';
import { TransferList } from '../../fields/TransferList';
import type { AutocompleteProps } from '../../fields/Autocomplete';
import { Autocomplete } from '../../fields/Autocomplete';
import { Select } from '../../fields/Select';
import { TextField } from '../../fields/TextField';
import { DatePicker } from '../../fields/DatePicker';
import { UploadButton } from '../../fields/UploadButton/UploadButton';

export type GenericFormProps<TFormFields> = {
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly formId?: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly formMethods: UseFormReturn<TFormFields>;
};

export const GenericForm = <TFormFields,>({
  formFieldDefinitions,
  formId,
  onSubmit,
  formMethods,
}: GenericFormProps<TFormFields>) => {
  const [t] = useTranslation();

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  const renderFormFieldDefinition = useCallback((formFieldDefinition: FormFieldDefinition<TFormFields>) => {
    switch (formFieldDefinition.definition) {
      case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        return (
          <Autocomplete
            {...formFieldDefinition as AutocompleteProps<TFormFields, Path<TFormFields>, false>}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
        return (
          <TransferList
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        return (
          <Select
            options={booleanOptions}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.DATE:
        return (
          <DatePicker
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        return (
          <RichTextEditor
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.FILE:
        return (
          <UploadButton
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
      default:
        return (
          <TextField
            {...formFieldDefinition}
          />
        );
    }
  }, [booleanOptions]);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        id={formId}
        onSubmit={onSubmit}
      >
        {formFieldDefinitions.map(formFieldDefinition => (
          <Box
            key={formFieldDefinition.name}
            marginY={1}
          >
            {renderFormFieldDefinition(formFieldDefinition)}
          </Box>
        ))}
      </form>
    </FormProvider>
  );
};
