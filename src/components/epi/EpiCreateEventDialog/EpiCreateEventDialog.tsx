import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  type ReactElement,
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

import type {
  Case,
  CompleteCaseType,
  CaseSet,
} from '../../../api';
import { CaseApi } from '../../../api';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { useCaseSetCategoryOptionsQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusOptionsQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { useCreateMutation } from '../../../hooks/useCreateMutation';
import { useItemQuery } from '../../../hooks/useItemQuery';
import type {
  AutoCompleteOption,
  FormFieldDefinition,
} from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { GenericForm } from '../../form/helpers/GenericForm';
import type { DialogAction } from '../../ui/Dialog';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { EpiCasesAlreadyInCaseSetWarning } from '../EpiCasesAlreadyInCaseSetWarning';
import { useArray } from '../../../hooks/useArray';

import { EpiCreateEventDialogSuccessNotificationMessage } from './EpiCreateEventDialogSuccessNotificationMessage';

export interface EpiCreateEventDialogOpenProps {
  readonly rows?: Case[];
  readonly completeCaseType?: CompleteCaseType;
}

export interface EpiCreateEventDialogProps extends WithDialogRenderProps<EpiCreateEventDialogOpenProps> {
}

export type EpiCreateEventDialogRefMethods = WithDialogRefMethods<EpiCreateEventDialogProps, EpiCreateEventDialogOpenProps>;

type FormFields = {
  name: string;
  description: string;
  shouldApplySharingToCases: boolean;
  case_type_id: string;
  case_set_category_id: string;
  case_set_status_id: string;
  create_in_data_collection_id: string;
  share_in_data_collection_ids: string[];
};

export const EpiCreateEventDialog = withDialog<EpiCreateEventDialogProps, EpiCreateEventDialogOpenProps>((
  {
    onClose,
    onTitleChange,
    onActionsChange,
    openProps,
  }: EpiCreateEventDialogProps,
): ReactElement => {
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const [t] = useTranslation();
  const formId = useId();

  const schema = useMemo(() => object<FormFields>().shape({
    name: string().extendedAlphaNumeric().required().max(100),
    description: string().freeFormText(),
    case_type_id: string().uuid4().required(),
    case_set_category_id: string().uuid4().required(),
    case_set_status_id: string().uuid4().required(),
    create_in_data_collection_id: string().uuid4().required(),
    share_in_data_collection_ids: array().of(string().uuid4()),
    shouldApplySharingToCases: boolean().required(),
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    values: {
      name: openProps.completeCaseType ? t('New {{eventName}} event', { eventName: openProps.completeCaseType.name }) : '',
      description: '',
      case_type_id: openProps.completeCaseType?.id ?? null,
      case_set_category_id: null,
      case_set_status_id: null,
      create_in_data_collection_id: null,
      share_in_data_collection_ids: [],
      shouldApplySharingToCases: true,
    },
  });
  const { handleSubmit, setValue } = formMethods;

  const { control } = formMethods;
  const { case_type_id: userSelectedCaseTypeId, create_in_data_collection_id: createdInDataCollectionId, share_in_data_collection_ids: sharedInDataCollectionIds } = useWatch({ control });

  const sanitizedCompleteCaseTypeId = openProps.completeCaseType?.id ?? userSelectedCaseTypeId;

  const { isLoading: isCompleteCaseTypeLoading, error: completeCaseTypeError, data: loadedCompleteCaseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: sanitizedCompleteCaseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseApi.getInstance().completeCaseTypesGetOne(sanitizedCompleteCaseTypeId, { signal })).data;
      },
      enabled: !openProps.completeCaseType && !!sanitizedCompleteCaseTypeId,
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
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
        loading: caseTypeOptionsQuery.isLoading,
        disabled: !!openProps.completeCaseType,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'create_in_data_collection_id',
        label: t`Create in data collection`,
        options: createInDataCollectionOptions,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'share_in_data_collection_ids',
        label: t`Share in data collections`,
        options: shareInDataCollectionOptions,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'shouldApplySharingToCases',
        label: t`Should the same sharing be applied to the cases in the event?`,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        disabled: sharedInDataCollectionIds.length === 0 || !openProps.rows?.length,
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
  }, [caseSetCategoryOptionsQuery.isLoading, caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.isLoading, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options, createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, openProps.completeCaseType, openProps.rows?.length, shareInDataCollectionOptions, sharedInDataCollectionIds.length, t]);

  const loadables = useArray([
    caseTypeOptionsQuery,
    caseSetCategoryOptionsQuery,
    caseSetStatusOptionsQuery,
    dataCollectionOptionsQuery,
  ]);


  const isLoading = loadables.some(x => x.isLoading);

  const onSuccess = useCallback(async (item: CaseSet, variables: FormFields) => {
    if (variables.shouldApplySharingToCases) {
      await EpiCaseUtil.applyDataCollectionLinks({
        caseSetId: item.id,
        caseIds: openProps.rows ? openProps.rows.map(row => row.id) : undefined,
        caseSetDataCollectionIds: variables.share_in_data_collection_ids,
      });
    }
    EpiEventBusManager.instance.emit('onEventCreated');
    onClose();
  }, [onClose, openProps.rows]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onError = useCallback(async () => {
    EpiEventBusManager.instance.emit('onEventCreated');
    onClose();
  }, [onClose]);

  const { mutate: mutateCreate, isMutating: isCreating } = useCreateMutation<CaseSet, FormFields>({
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    associationQueryKeys: [
      ...QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SETS]),
      ...QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_MEMBERS], true),
      ...QueryUtil.getQueryKeyDependencies([QUERY_KEY.DATA_COLLECTION_SET_MEMBERS], true),
    ],
    onSuccess,
    onError,
    queryFn: async (formData: FormFields): Promise<CaseSet> => {
      const caseSetResult = (await CaseApi.getInstance().createCaseSet({
        case_set: {
          case_set_category_id: formData.case_set_category_id,
          case_set_status_id: formData.case_set_status_id,
          description: formData.description,
          name: formData.name,
          case_type_id: formData.case_type_id,
          created_in_data_collection_id: formData.create_in_data_collection_id,
        },
        data_collection_ids: formData.share_in_data_collection_ids,
        case_ids: openProps.rows?.map(row => row.id) ?? [],
      })).data;

      return caseSetResult;
    },
    getProgressNotificationMessage: (variables) => t('Creating event: {{name}}...', { name: variables.name }),
    getErrorNotificationMessage: (item, _error) => t('Failed to create event: {{name}}', { name: item.name }),
    getSuccessNotificationMessage: (item) => (
      <EpiCreateEventDialogSuccessNotificationMessage
        isCreating
        caseSet={item}
      />
    ),
  });

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('EpiCreateEventDialog-saveButton'),
      color: 'secondary',
      autoFocus: true,
      variant: 'contained',
      form: formId,
      type: 'submit',
      label: t`Save`,
      startIcon: <SaveIcon />,
      disabled: isLoading || isCreating,
    });
    onActionsChange(actions);
  }, [formId, isCreating, isLoading, onActionsChange, t]);

  const onFormSubmit = useCallback((formData: FormFields) => {
    mutateCreate(formData);
  }, [mutateCreate]);

  useEffect(() => {
    let title = '';
    if (openProps.completeCaseType) {
      if (openProps.rows?.length) {
        title = t('Create new event from {{numCases}} selected {{caseTypeName}} cases', { numCases: openProps.rows.length, caseTypeName: openProps.completeCaseType.name });
      } else {
        title = t('Create event');
      }
    } else {
      title = t('Create event');
    }
    onTitleChange(title);
  }, [onTitleChange, openProps, t]);

  return (
    <ResponseHandler
      inlineSpinner
      error={completeCaseTypeError}
      isLoading={isCreating}
      loadables={loadables}
    >
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      {openProps.rows?.length > 0 && (
        <EpiCasesAlreadyInCaseSetWarning
          cases={openProps.rows}
        />
      )}
    </ResponseHandler>
  );
}, {
  testId: 'EpiCreateEventDialog',
  maxWidth: 'lg',
  fullWidth: true,
});
