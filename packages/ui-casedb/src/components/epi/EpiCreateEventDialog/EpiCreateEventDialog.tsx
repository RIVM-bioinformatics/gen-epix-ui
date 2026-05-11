import {
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import {
  array,
  boolean,
  object,
  string,
} from 'yup';
import {
  type Resolver,
  useForm,
  useWatch,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Alert,
  Box,
} from '@mui/material';
import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  AutoCompleteOption,
  DialogAction,
  FormFieldDefinition,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  FORM_FIELD_DEFINITION_TYPE,
  GenericForm,
  LoadableUtil,
  QueryClientManager,
  ResponseHandler,
  SchemaUtil,
  TestIdUtil,
  useArray,
  useCreateMutation,
  useItemQuery,
  withDialog,
} from '@gen-epix/ui';

import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { useCaseSetCategoryOptionsQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusOptionsQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { CaseUtil } from '../../../utils/CaseUtil';
import { EpiCasesAlreadyInCaseSetWarning } from '../EpiCasesAlreadyInCaseSetWarning';
import { CASEDB_QUERY_KEY } from '../../../data/query';

import { EpiCreateEventDialogSuccessNotificationMessage } from './EpiCreateEventDialogSuccessNotificationMessage';

export interface EpiCreateEventDialogOpenProps {
  readonly completeCaseType?: CaseDbCompleteCaseType;
  readonly rows?: CaseDbCase[];
}

export interface EpiCreateEventDialogProps extends WithDialogRenderProps<EpiCreateEventDialogOpenProps> {
}

export type EpiCreateEventDialogRefMethods = WithDialogRefMethods<EpiCreateEventDialogProps, EpiCreateEventDialogOpenProps>;

type FormFields = {
  case_set_category_id: string;
  case_set_status_id: string;
  case_type_id: string;
  code: string;
  create_in_data_collection_id: string;
  description: string;
  name: string;
  share_in_data_collection_ids: string[];
  shouldApplySharingToCases: boolean;
};

export const EpiCreateEventDialog = withDialog<EpiCreateEventDialogProps, EpiCreateEventDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiCreateEventDialogProps,
): ReactElement => {
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const { t } = useTranslation();
  const formId = useId();

  const schema = useMemo(() => object<FormFields>().shape({
    case_set_category_id: string().uuid4().required(),
    case_set_status_id: string().uuid4().required(),
    case_type_id: string().uuid4().required(),
    code: SchemaUtil.code,
    create_in_data_collection_id: string().uuid4().required(),
    description: SchemaUtil.description.required(),
    name: SchemaUtil.name,
    share_in_data_collection_ids: array().of(string().uuid4()),
    shouldApplySharingToCases: boolean().required(),
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values: {
      case_set_category_id: null,
      case_set_status_id: null,
      case_type_id: openProps.completeCaseType?.id ?? null,
      code: '',
      create_in_data_collection_id: null,
      description: '',
      name: openProps.completeCaseType ? t('New {{eventName}} event', { eventName: openProps.completeCaseType.name }) : '',
      share_in_data_collection_ids: [],
      shouldApplySharingToCases: true,
    },
  });
  const { control, handleSubmit, setValue } = formMethods;

  const { case_type_id: userSelectedCaseTypeId, create_in_data_collection_id: createdInDataCollectionId, share_in_data_collection_ids: sharedInDataCollectionIds } = useWatch({ control });

  const sanitizedCompleteCaseTypeId = openProps.completeCaseType?.id ?? userSelectedCaseTypeId;

  const { data: loadedCompleteCaseType, error: completeCaseTypeError, isLoading: isCompleteCaseTypeLoading } = useItemQuery({
    baseQueryKey: CASEDB_QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: sanitizedCompleteCaseTypeId,
    useQueryOptions: {
      enabled: !openProps.completeCaseType && !!sanitizedCompleteCaseTypeId,
      queryFn: async ({ signal }) => {
        return (await CaseDbCaseApi.getInstance().completeCaseTypesGetOne(sanitizedCompleteCaseTypeId, { signal })).data;
      },
    },
  });

  const completeCaseType = openProps.completeCaseType ?? loadedCompleteCaseType;

  const createInDataCollectionOptions = useMemo<AutoCompleteOption[]>(() => {
    if (!completeCaseType || !dataCollectionOptionsQuery.options?.length) {
      return [];
    }
    return dataCollectionOptionsQuery.options.filter(option => {
      const dataCollectionId = option.value;
      return completeCaseType.case_type_access_abacs[dataCollectionId]?.is_private && completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
    });
  }, [completeCaseType, dataCollectionOptionsQuery.options]);

  const shareInDataCollectionOptions = useMemo<AutoCompleteOption[]>(() => {
    if (!completeCaseType) {
      return [];
    }
    return dataCollectionOptionsQuery.options.filter(option => {
      const dataCollectionId = option.value;
      return createdInDataCollectionId !== dataCollectionId && completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
    });
  }, [completeCaseType, createdInDataCollectionId, dataCollectionOptionsQuery.options]);

  useEffect(() => {
    // Validate if the createdInDataCollectionId is in the shareInDataCollectionIds
    // If it is, remove it from the shareInDataCollectionIds
    if (sharedInDataCollectionIds?.length && sharedInDataCollectionIds.includes(createdInDataCollectionId)) {
      setValue('share_in_data_collection_ids', sharedInDataCollectionIds.filter(id => id !== createdInDataCollectionId));
    }
  }, [createdInDataCollectionId, setValue, sharedInDataCollectionIds]);

  useEffect(() => {
    if (openProps.completeCaseType) {
      return;
    }
    setValue('create_in_data_collection_id', null);
    setValue('share_in_data_collection_ids', []);
  }, [completeCaseType, openProps.completeCaseType, setValue]);

  useEffect(() => {
    if (dataCollectionOptionsQuery.isLoading || !createInDataCollectionOptions?.length) {
      return;
    }

    if (createInDataCollectionOptions?.length === 1) {
      setValue('create_in_data_collection_id', createInDataCollectionOptions[0].value as string);
    }
  }, [createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, setValue]);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!openProps.completeCaseType,
        label: t`Case type`,
        loading: caseTypeOptionsQuery.isLoading,
        name: 'case_type_id',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Create in data collection`,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        name: 'create_in_data_collection_id',
        options: createInDataCollectionOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Share in data collections`,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        multiple: true,
        name: 'share_in_data_collection_ids',
        options: shareInDataCollectionOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        disabled: sharedInDataCollectionIds.length === 0 || !openProps.rows?.length,
        label: t`Should the same sharing be applied to the cases in the event?`,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        name: 'shouldApplySharingToCases',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Event name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Event code`,
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
  }, [caseSetCategoryOptionsQuery.isLoading, caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.isLoading, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options, createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, openProps.completeCaseType, openProps.rows?.length, shareInDataCollectionOptions, sharedInDataCollectionIds.length, t]);

  const loadables = useArray([
    caseTypeOptionsQuery,
    caseSetCategoryOptionsQuery,
    caseSetStatusOptionsQuery,
    dataCollectionOptionsQuery,
  ]);


  const isLoading = LoadableUtil.isSomeLoading(loadables);

  const onSuccess = useCallback(async (item: CaseDbCaseSet, variables: FormFields) => {
    if (variables.shouldApplySharingToCases) {
      await CaseUtil.applyDataCollectionLinks({
        caseIds: openProps.rows ? openProps.rows.map(row => row.id) : undefined,
        caseSetDataCollectionIds: variables.share_in_data_collection_ids,
        caseSetId: item.id,
        caseTypeId: completeCaseType.id,
      });
    }
    EpiEventBusManager.getInstance().emit('onEventCreated');
    onClose();
  }, [completeCaseType?.id, onClose, openProps.rows]);

  const onError = useCallback(() => {
    EpiEventBusManager.getInstance().emit('onEventCreated');
    onClose();
  }, [onClose]);

  const { isMutating: isCreating, mutate: mutateCreate } = useCreateMutation<CaseDbCaseSet, FormFields>({
    associationQueryKeys: [
      ...QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASE_SETS]),
      ...QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASE_SET_MEMBERS], true),
      ...QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.DATA_COLLECTION_SET_MEMBERS], true),
    ],
    getErrorNotificationMessage: (item, _error) => t('Failed to create event: {{name}}', { name: item.name }),
    getProgressNotificationMessage: (variables) => t('Creating event: {{name}}...', { name: variables.name }),
    getSuccessNotificationMessage: (item) => (
      <EpiCreateEventDialogSuccessNotificationMessage
        caseSet={item}
        isCreating
      />
    ),
    onError,
    onSuccess,
    queryFn: async (formData: FormFields): Promise<CaseDbCaseSet> => {
      const caseSetResult = (await CaseDbCaseApi.getInstance().createCaseSet({
        case_ids: openProps.rows?.map(row => row.id) ?? [],
        case_set: {
          case_set_category_id: formData.case_set_category_id,
          case_set_status_id: formData.case_set_status_id,
          case_type_id: formData.case_type_id,
          code: formData.code,
          created_in_data_collection_id: formData.create_in_data_collection_id,
          description: formData.description,
          name: formData.name,
        },
        data_collection_ids: formData.share_in_data_collection_ids,
      })).data;

      return caseSetResult;
    },
    resourceQueryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SETS),
  });

  const isFormDisabled = useMemo(() => {
    return isLoading || caseTypeOptionsQuery.options?.length === 0 || dataCollectionOptionsQuery.options?.length === 0;
  }, [isLoading, caseTypeOptionsQuery.options?.length, dataCollectionOptionsQuery.options?.length]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    if (isLoading || !isFormDisabled) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiCreateEventDialog-saveButton'),
        autoFocus: true,
        color: 'secondary',
        disabled: isLoading || isCreating,
        form: formId,
        label: t`Save`,
        loading: isLoading,
        startIcon: <SaveIcon />,
        type: 'submit',
        variant: 'contained',
      });
    }
    onActionsChange(actions);
  }, [formId, isCreating, isLoading, onActionsChange, t, caseTypeOptionsQuery.options?.length, isFormDisabled]);

  const onFormSubmit = useCallback((formData: FormFields) => {
    mutateCreate(formData);
  }, [mutateCreate]);

  useEffect(() => {
    if (openProps.completeCaseType) {
      if (openProps.rows?.length) {
        onTitleChange(t('Create new event from {{numCases}} selected {{caseTypeName}} cases', { caseTypeName: openProps.completeCaseType.name, numCases: openProps.rows.length }));
      } else {
        onTitleChange(t('Create event'));
      }
    } else {
      onTitleChange(t('Create event'));
    }
  }, [onTitleChange, openProps, t]);

  return (
    <ResponseHandler
      error={completeCaseTypeError}
      inlineSpinner
      isLoading={isCreating}
      loadables={loadables}
    >
      {isFormDisabled ? (
        <Box>
          <Alert severity={'error'}>
            {t`You do not have the required permissions to create an event. Contact your organization administrator for assistance.`}
          </Alert>
        </Box>
      ) : (
        <GenericForm<FormFields>
          disableAll={isFormDisabled}
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={handleSubmit(onFormSubmit)}
          schema={schema}
        />
      )}
      {openProps.rows?.length > 0 && (
        <EpiCasesAlreadyInCaseSetWarning
          cases={openProps.rows}
        />
      )}
    </ResponseHandler>
  );
}, {
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiCreateEventDialog',
});
