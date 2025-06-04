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
import { useCaseSetCategoryOptions } from '../../../dataHooks/useCaseSetCategories';
import { useCaseSetStatusOptions } from '../../../dataHooks/useCaseSetStatuses';
import { useCaseTypeOptions } from '../../../dataHooks/useCaseTypes';
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
  const caseTypeOptions = useCaseTypeOptions();
  const caseSetCategoryOptions = useCaseSetCategoryOptions();
  const caseSetStatusOptions = useCaseSetStatusOptions();

  const schema = useMemo(() => object<FormFields>().shape({
    name: string().extendedAlphaNumeric().required().max(100),
    description: string().freeFormText(),
    case_type_id: string().uuid4().required(),
    case_set_category_id: string().uuid4().required(),
    case_set_status_id: string().uuid4().required(),
  }), []);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onSuccess = useCallback(async () => {
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
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptions.options,
        loading: caseTypeOptions.isLoading,
        disabled: !!caseSet,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Event name`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.MARKDOWN,
        name: 'description',
        label: t`Description`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_set_category_id',
        label: t`Category`,
        options: caseSetCategoryOptions.options,
        loading: caseSetCategoryOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_set_status_id',
        label: t`Status`,
        options: caseSetStatusOptions.options,
        loading: caseSetStatusOptions.isLoading,
      },
    ];
  }, [caseSet, caseSetCategoryOptions.isLoading, caseSetCategoryOptions.options, caseSetStatusOptions.isLoading, caseSetStatusOptions.options, caseTypeOptions.isLoading, caseTypeOptions.options]);

  const { mutate: mutateEdit, isMutating: isEditing, setPreviousItem } = useEditMutation<CaseSet, FormFields>({
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    onSuccess,
    onError,
    queryFn: async (formData: FormFields, item: CaseSet): Promise<CaseSet> => {
      const result = await CaseApi.getInstance().caseSetsPutOne(item.id, { ...item, ...formData });
      return result.data;
    },
    getProgressNotificationMessage: (data) => t('Saving event: {{name}}', { name: data.name }),
    getErrorNotificationMessage: (variables, _error) => t('Failed to edit event: {{name}}', { name: variables.name }),
    // eslint-disable-next-line react/no-unstable-nested-components
    getSuccessNotificationMessage: (item) => <EpiCreateEventDialogSuccessNotificationMessage caseSet={item} />,
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
    />
  );
};
