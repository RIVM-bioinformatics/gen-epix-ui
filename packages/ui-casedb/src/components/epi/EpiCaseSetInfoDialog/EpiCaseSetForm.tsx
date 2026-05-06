import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { t } from 'i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  object,
  string,
} from 'yup';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import { EpiCreateEventDialogSuccessNotificationMessage } from '../EpiCreateEventDialog/EpiCreateEventDialogSuccessNotificationMessage';
import { useCaseSetCategoryOptionsQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusOptionsQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../../dataHooks/useCaseTypesQuery';
import { OmitWithMetaData, SchemaUtil, FormFieldDefinition, FORM_FIELD_DEFINITION_TYPE, useEditMutation, QueryKeyManager, FormUtil, Spinner, GenericForm } from '@gen-epix/ui';
import { CASEDB_QUERY_KEY } from '../../../data/query';

export type EpiCaseSetFormProps = {
  readonly caseSet: CaseDbCaseSet;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
};

type FormFields = OmitWithMetaData<CaseDbCaseSet, 'case_set_category' | 'case_set_date' | 'case_set_status' | 'case_type' | 'created_in_data_collection_id' | 'created_in_data_collection'>;

export const EpiCaseSetForm = ({ caseSet, formId, onFinish, onIsSavingChange }: EpiCaseSetFormProps) => {
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();

  const schema = useMemo(() => object<FormFields>().shape({
    case_set_category_id: string().uuid4().required(),
    case_set_status_id: string().uuid4().required(),
    case_type_id: string().uuid4().required(),
    code: SchemaUtil.code,
    description: SchemaUtil.description,
    name: SchemaUtil.name,
  }), []);


  const onSuccess = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const onError = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!caseSet,
        label: t`Case type`,
        loading: caseTypeOptionsQuery.isLoading,
        name: 'case_type_id',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Event name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Category`,
        loading: caseSetCategoryOptionsQuery.isLoading,
        name: 'case_set_category_id',
        options: caseSetCategoryOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Status`,
        loading: caseSetStatusOptionsQuery.isLoading,
        name: 'case_set_status_id',
        options: caseSetStatusOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseSet, caseSetCategoryOptionsQuery.isLoading, caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.isLoading, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options]);

  const { isMutating: isEditing, mutate: mutateEdit, setPreviousItem } = useEditMutation<CaseDbCaseSet, FormFields>({
    getErrorNotificationMessage: (data) => t('Failed to edit event: {{name}}', { name: data.name }),
    getIntermediateItem: (variables: FormFields, previousItem: CaseDbCaseSet) => ({ ...previousItem, ...variables }),
    getProgressNotificationMessage: (data) => t('Saving event: {{name}}', { name: data.name }),
    getSuccessNotificationMessage: (item) => <EpiCreateEventDialogSuccessNotificationMessage caseSet={item} />,
    onError,
    onSuccess,
    queryFn: async (formData: FormFields, item: CaseDbCaseSet): Promise<CaseDbCaseSet> => {
      const result = await CaseDbCaseApi.getInstance().caseSetsPutOne(item.id, { ...item, ...formData });
      return result.data;
    },
    resourceQueryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SETS),
  });

  useEffect(() => {
    onIsSavingChange(isEditing);
  }, [isEditing, onIsSavingChange]);

  const onFormSubmit = useCallback((formData: FormFields) => {
    setPreviousItem(caseSet);
    mutateEdit(formData);
  }, [caseSet, mutateEdit, setPreviousItem]);

  const values = useMemo(() => FormUtil.createFormValues<FormFields, CaseDbCaseSet>(formFieldDefinitions, caseSet), [formFieldDefinitions, caseSet]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    values,
  });
  const { handleSubmit } = formMethods;

  if (isEditing) {
    return (
      <Spinner
        inline
        label={t`Saving event data`}
      />
    );
  }

  return (
    <GenericForm<FormFields>
      formFieldDefinitions={formFieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={handleSubmit(onFormSubmit)}
      schema={schema}
    />
  );
};
