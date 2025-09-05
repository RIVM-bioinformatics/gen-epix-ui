import {
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  object,
  string,
} from 'yup';
import { Box } from '@mui/system';
import { Button } from '@mui/material';

import { CaseApi } from '../../../api';
import { useCaseTypeOptionsQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useItemQuery } from '../../../hooks/useItemQuery';
import type {
  AutoCompleteOption,
  FormFieldDefinition,
} from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { useArray } from '../../../hooks/useArray';
import { GenericForm } from '../../form/helpers/GenericForm';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';

export type EpiUploadSettingsFormFields = {
  case_type_id: string;
  create_in_data_collection_id: string;
};

export type EpiUploadSettingsProps = {
  readonly onBack: () => void;
  readonly onProceed: (data: EpiUploadSettingsFormFields) => void;
};

const EpiUploadSettings = ({ onBack, onProceed }: EpiUploadSettingsProps) => {
  const [t] = useTranslation();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const formId = useId();

  const schema = useMemo(() => object<EpiUploadSettingsFormFields>().shape({
    case_type_id: string().uuid4().required(),
    create_in_data_collection_id: string().uuid4().required(),
  }), []);

  const formMethods = useForm<EpiUploadSettingsFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadSettingsFormFields>,
    values: {
      case_type_id: null,
      create_in_data_collection_id: null,
    },
  });
  const { handleSubmit, setValue } = formMethods;
  const { control } = formMethods;
  const { case_type_id: userSelectedCaseTypeId } = useWatch({ control });

  const { isLoading: isCompleteCaseTypeLoading, error: completeCaseTypeError, data: completeCaseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: userSelectedCaseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseApi.getInstance().completeCaseTypesGetOne(userSelectedCaseTypeId, { signal })).data;
      },
      enabled: !!userSelectedCaseTypeId,
    },
  });

  const createInDataCollectionOptions = useMemo<AutoCompleteOption[]>(() => {
    if (!completeCaseType || !dataCollectionOptionsQuery.options?.length) {
      return [];
    }
    return dataCollectionOptionsQuery.options.filter(option => {
      const dataCollectionId = option.value;
      return completeCaseType.case_type_access_abacs[dataCollectionId]?.is_private && completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
    });
  }, [completeCaseType, dataCollectionOptionsQuery.options]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadSettingsFormFields>[]>(() => {
    return [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'case_type_id',
          label: t`Case type`,
          options: caseTypeOptionsQuery.options,
          loading: caseTypeOptionsQuery.isLoading,
        } as const satisfies FormFieldDefinition<EpiUploadSettingsFormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'create_in_data_collection_id',
          label: t`Create in data collection`,
          options: createInDataCollectionOptions,
          loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
          disabled: !userSelectedCaseTypeId,
        } as const satisfies FormFieldDefinition<EpiUploadSettingsFormFields>,
    ] as const;
  }, [t, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, userSelectedCaseTypeId]);

  useEffect(() => {
    if (dataCollectionOptionsQuery.isLoading || !createInDataCollectionOptions?.length) {
      return;
    }

    if (createInDataCollectionOptions?.length === 1) {
      setValue('create_in_data_collection_id', createInDataCollectionOptions[0].value as string);
    }
  }, [createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, setValue]);

  const onFormSubmit = useCallback((formData: EpiUploadSettingsFormFields) => {
    console.log(formData);
    onProceed(formData);
  }, [onProceed]);

  const loadables = useArray([
    caseTypeOptionsQuery,
  ]);

  const onBackButtonClick = useCallback(() => {
    onBack();
  }, [onBack]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (
    <ResponseHandler
      inlineSpinner
      error={completeCaseTypeError}
      loadables={loadables}
    >
      <GenericForm<EpiUploadSettingsFormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant={'outlined'}
          onClick={onBackButtonClick}
        >
          {t('Back')}
        </Button>
        <Button
          variant={'contained'}
          onClick={onProceedButtonClick}
        >
          {t('Proceed')}
        </Button>
      </Box>
    </ResponseHandler>
  );
};

export default EpiUploadSettings;
