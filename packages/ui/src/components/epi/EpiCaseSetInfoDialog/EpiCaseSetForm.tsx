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

import { EpiCreateEventDialogSuccessNotificationMessage } from '../EpiCreateEventDialog/EpiCreateEventDialogSuccessNotificationMessage';
import type { CaseSet } from '../../../api';
import { CaseApi } from '../../../api';
import { useCaseSetCategoryOptionsQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusOptionsQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useEditMutation } from '../../../hooks/useEditMutation';
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { FormUtil } from '../../../utils/FormUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { GenericForm } from '../../form/helpers/GenericForm';
import { Spinner } from '../../ui/Spinner';
import type { OmitWithMetaData } from '../../../models/data';
import { SchemaUtil } from '../../../utils/SchemaUtil';

export type EpiCaseSetFormProps = {
  readonly caseSet: CaseSet;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
};

type FormFields = OmitWithMetaData<CaseSet, 'case_set_category' | 'case_set_date' | 'case_set_status' | 'case_type' | 'created_in_data_collection_id' | 'created_in_data_collection'>;

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

  // eslint-disable-next-line @typescript-eslint/require-await
  const onError = useCallback(async () => {
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

  const { isMutating: isEditing, mutate: mutateEdit, setPreviousItem } = useEditMutation<CaseSet, FormFields>({
    getErrorNotificationMessage: (data) => t('Failed to edit event: {{name}}', { name: data.name }),
    getIntermediateItem: (variables: FormFields, previousItem: CaseSet) => ({ ...previousItem, ...variables }),
    getProgressNotificationMessage: (data) => t('Saving event: {{name}}', { name: data.name }),
    getSuccessNotificationMessage: (item) => <EpiCreateEventDialogSuccessNotificationMessage caseSet={item} />,
    onError,
    onSuccess,
    queryFn: async (formData: FormFields, item: CaseSet): Promise<CaseSet> => {
      const result = await CaseApi.instance.caseSetsPutOne(item.id, { ...item, ...formData });
      return result.data;
    },
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
  });

  useEffect(() => {
    onIsSavingChange(isEditing);
  }, [isEditing, onIsSavingChange]);

  const onFormSubmit = useCallback((formData: FormFields) => {
    setPreviousItem(caseSet);
    mutateEdit(formData);
  }, [caseSet, mutateEdit, setPreviousItem]);

  const values = useMemo(() => FormUtil.createFormValues<FormFields, CaseSet>(formFieldDefinitions, caseSet), [formFieldDefinitions, caseSet]);

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
