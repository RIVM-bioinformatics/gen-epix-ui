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
import { RadioGroup } from '../../fields/RadioGroup';

export type GenericFormProps<TFormFields> = {
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly formId?: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly formMethods: UseFormReturn<TFormFields>;
  readonly renderField?: (definition: FormFieldDefinition<TFormFields>, element: ReactElement) => ReactElement;
  readonly wrapForm?: (children: ReactElement) => ReactElement;
  readonly disableAll?: boolean;
};

export const GenericForm = <TFormFields,>({
  formFieldDefinitions,
  formId,
  onSubmit,
  formMethods,
  renderField,
  wrapForm,
  disableAll,
}: GenericFormProps<TFormFields>) => {
  const [t] = useTranslation();

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  const renderFormFieldDefinition = useCallback((formFieldDefinition: FormFieldDefinition<TFormFields>) => {
    switch (formFieldDefinition.definition) {
      case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        return (
          <Autocomplete
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition as AutocompleteProps<TFormFields, Path<TFormFields>, false>}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
        return (
          <TransferList
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        return (
          <Select
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            options={booleanOptions}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.DATE:
        return (
          <DatePicker
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        return (
          <RichTextEditor
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.FILE:
        return (
          <UploadButton
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP:
        return (
          <RadioGroup
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
      default:
        return (
          <TextField
            disabled={Object.hasOwn(formFieldDefinition, 'disabled') ? formFieldDefinition.disabled : disableAll}
            {...formFieldDefinition}
          />
        );
    }
  }, [booleanOptions, disableAll]);


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
