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

export type EpiCaseSetFormProps = {
  readonly caseSet: CaseSet;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
};

type FormFields = Pick<CaseSet, 'name' | 'description' | 'case_type_id' | 'case_set_category_id' | 'case_set_status_id'>;

export const EpiCaseSetForm = ({ caseSet, formId, onFinish, onIsSavingChange }: EpiCaseSetFormProps) => {
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();

  const schema = useMemo(() => object<FormFields>().shape({
    name: string().extendedAlphaNumeric().required().max(100),
    description: string().freeFormText(),
    case_type_id: string().uuid4().required(),
    case_set_category_id: string().uuid4().required(),
    case_set_status_id: string().uuid4().required(),
  }), []);


  const onSuccess = useCallback(async () => {
    // FIXME: this should be fixed in useEditMutation
    await QueryUtil.invalidateQueryKeys([QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSet.id)]);
    onFinish();
  }, [caseSet.id, onFinish]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onError = useCallback(async () => {
    onFinish();
  }, [onFinish]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
        loading: caseTypeOptionsQuery.isLoading,
        disabled: !!caseSet,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Event name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        name: 'description',
        label: t`Description`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_set_category_id',
        label: t`Category`,
        options: caseSetCategoryOptionsQuery.options,
        loading: caseSetCategoryOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_set_status_id',
        label: t`Status`,
        options: caseSetStatusOptionsQuery.options,
        loading: caseSetStatusOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseSet, caseSetCategoryOptionsQuery.isLoading, caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.isLoading, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options]);

  const { mutate: mutateEdit, isMutating: isEditing, setPreviousItem } = useEditMutation<CaseSet, FormFields>({
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    onSuccess,
    onError,
    queryFn: async (formData: FormFields, item: CaseSet): Promise<CaseSet> => {
      const result = await CaseApi.instance.caseSetsPutOne(item.id, { ...item, ...formData });
      return result.data;
    },
    getProgressNotificationMessage: (data) => t('Saving event: {{name}}', { name: data.name }),
    getErrorNotificationMessage: (data) => t('Failed to edit event: {{name}}', { name: data.name }),
    // eslint-disable-next-line react/no-unstable-nested-components
    getSuccessNotificationMessage: (item) => <EpiCreateEventDialogSuccessNotificationMessage caseSet={item} />,
    getIntermediateItem: (variables: FormFields, previousItem: CaseSet) => ({ ...previousItem, ...variables }),
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
      schema={schema}
      onSubmit={handleSubmit(onFormSubmit)}
    />
  );
};
