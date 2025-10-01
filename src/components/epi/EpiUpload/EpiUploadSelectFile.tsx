import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  mixed,
  object,
  string,
} from 'yup';
import {
  Alert,
  AlertTitle,
  Container,
  Typography,
} from '@mui/material';

import { CaseApi } from '../../../api';
import {
  useCaseTypeOptionsQuery,
  useCaseTypesQuery,
} from '../../../dataHooks/useCaseTypesQuery';
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
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import { useCaseTypeColsQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import {
  EPI_UPLOAD_ACTION,
  type EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';

type FormFields = {
  import_action: EPI_UPLOAD_ACTION;
  case_type_id: string;
  create_in_data_collection_id: string;
  share_in_data_collection_ids: string[];
  file_list: FileList;
  sheet: string;
};

export type EpiUploadSelectFileProps = {
  readonly onProceed: (data: EpiUploadSelectFileResult) => void;
  readonly defaultValues?: FormFields;
};

const EpiUploadSelectFile = ({ onProceed, defaultValues }: EpiUploadSelectFileProps) => {
  const [t] = useTranslation();
  const caseTypesQuery = useCaseTypesQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const caseTypeColsQuery = useCaseTypeColsQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const [fileParsingError, setFileParsingError] = useState<string | null>(null);
  const formId = useId();
  const sheetId = useId();
  const [rawData, setRawData] = useState<string[][] | null>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    case_type_id: string().uuid4().required(),
    file_list: mixed().required(t`File is required`),
    create_in_data_collection_id: string().uuid4().required(),
    sheet: string().required(t`Sheet is required`),
    import_action: mixed<EPI_UPLOAD_ACTION>().oneOf(Object.values(EPI_UPLOAD_ACTION)).required(),
  }), [t]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: {
      case_type_id: null,
      create_in_data_collection_id: null,
      file_list: null,
      sheet: null,
      import_action: EPI_UPLOAD_ACTION.CREATE,
      share_in_data_collection_ids: [],
    },
    values: {
      ...defaultValues,
    },
  });
  const { handleSubmit, setValue, setError } = formMethods;
  const { control } = formMethods;
  const { case_type_id: userSelectedCaseTypeId, file_list: userSelectedFile, sheet: userSelectedSheet, create_in_data_collection_id: userSelectedCreateInDataCollectionId, import_action: userSelectedImportAction } = useWatch({ control });
  const [ sheetOptions, setSheetOptions] = useState<AutoCompleteOption[]>([]);

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

  const shareInDataCollectionOptions = useMemo<AutoCompleteOption[]>(() => {
    if (!completeCaseType) {
      return [];
    }
    return dataCollectionOptionsQuery.options.filter(option => {
      const dataCollectionId = option.value;
      return userSelectedCreateInDataCollectionId !== dataCollectionId && completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
    });
  }, [completeCaseType, userSelectedCreateInDataCollectionId, dataCollectionOptionsQuery.options]);

  const createOrUpdateOptions = useMemo<AutoCompleteOption[]>(() => ([
    { label: t('Create new cases'), value: EPI_UPLOAD_ACTION.CREATE },
    { label: t('Update existing cases'), value: EPI_UPLOAD_ACTION.UPDATE },
  ]), [t]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP,
          name: 'import_action',
          label: t`Import action`,
          options: createOrUpdateOptions,
          row: true,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.FILE,
          name: 'file_list',
          label: t`File`,
          accept: '.csv,.tsv,.txt,.xlsx',
        } as const satisfies FormFieldDefinition<FormFields>,
    ];

    if (userSelectedFile?.[0]?.name.toLowerCase().endsWith('.xlsx')) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'sheet',
        label: t`Sheet`,
        options: sheetOptions,
        disabled: !userSelectedFile || !sheetOptions.length || !userSelectedFile?.[0]?.name.toLowerCase().endsWith('.xlsx'),
      } as const satisfies FormFieldDefinition<FormFields>);
    }

    fields.push(...[
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'case_type_id',
          label: t`Case type`,
          options: caseTypeOptionsQuery.options,
          loading: caseTypeOptionsQuery.isLoading,
          disabled: !userSelectedFile,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'create_in_data_collection_id',
          label: t`Create in data collection`,
          options: createInDataCollectionOptions,
          loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
          disabled: !userSelectedFile || !userSelectedCaseTypeId,
        } as const satisfies FormFieldDefinition<FormFields>,
    ] as const);

    if (userSelectedImportAction === EPI_UPLOAD_ACTION.CREATE) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'share_in_data_collection_ids',
        label: t`Share in data collections`,
        options: shareInDataCollectionOptions,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        disabled: !userSelectedCreateInDataCollectionId,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>);
    }
    return fields;
  }, [t, createOrUpdateOptions, userSelectedFile, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, userSelectedCaseTypeId, userSelectedImportAction, sheetOptions, shareInDataCollectionOptions, userSelectedCreateInDataCollectionId]);

  useEffect(() => {
    if (fileParsingError) {
      setError('file_list', { type: 'manual', message: fileParsingError });
    } else {
      setError('file_list', undefined);
    }
  }, [fileParsingError, setError, setValue]);

  useEffect(() => {
    // READ THE SHEET OPTIONS WHEN FILE CHANGES

    const perform = async (): Promise<void> => {
      if (!userSelectedFile?.[0]) {
        setValue('sheet', null);
        setSheetOptions([]);
        setValue('case_type_id', null);
        setValue('create_in_data_collection_id', null);
        return;
      }
      setFileParsingError(null);

      try {
        const options = await EpiUploadUtil.getSheetNameOptions(userSelectedFile);
        setSheetOptions(options);
        if (options.length === 1) {
          setValue('sheet', options[0].value, {
            shouldTouch: true,
            shouldDirty: true,
            shouldValidate: true,
          });
        } else {
          setValue('sheet', null);
        }
      } catch (_error) {
        setValue('sheet', null);
        setValue('file_list', null);
        setFileParsingError(t`Error reading sheet names from file`);
      }
    };
    void perform();
  }, [setValue, t, userSelectedFile]);

  useEffect(() => {
    const perform = async (): Promise<void> => {
      if (!userSelectedFile?.[0] || !userSelectedSheet) {
        return;
      }
      setFileParsingError(null);
      try {
        const parsedData = await EpiUploadUtil.readRawData(userSelectedFile, userSelectedSheet);
        // Call the callback with parsed data
        setRawData(parsedData);
      } catch (_error) {
        setValue('sheet', null);
        setValue('file_list', null);
        setFileParsingError(t`Error parsing file`);
      }
    };
    void perform();
  }, [setValue, sheetId, t, userSelectedFile, userSelectedSheet]);

  useEffect(() => {
    if (!rawData || caseTypeColsQuery.isLoading || !caseTypeColsQuery.data?.length) {
      return;
    }
    const bestMatchingCaseType = EpiUploadUtil.getCaseTypeFromColumnLabels(caseTypeColsQuery.data, rawData[0]);
    if (bestMatchingCaseType) {
      setValue('case_type_id', bestMatchingCaseType.id, {
        shouldTouch: true,
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [caseTypeColsQuery.data, caseTypeColsQuery.isLoading, rawData, setValue]);


  useEffect(() => {
    if (dataCollectionOptionsQuery.isLoading || !createInDataCollectionOptions?.length) {
      return;
    }

    if (createInDataCollectionOptions?.length === 1) {
      setValue('create_in_data_collection_id', createInDataCollectionOptions[0].value as string, {
        shouldTouch: true,
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, setValue]);

  const onFormSubmit = useCallback((formData: FormFields) => {
    onProceed({
      completeCaseType,
      createInDataCollection: dataCollectionsMapQuery.map.get(formData.create_in_data_collection_id),
      rawData,
      case_type_id: formData.case_type_id,
      create_in_data_collection_id: formData.create_in_data_collection_id,
      share_in_data_collection_ids: formData.share_in_data_collection_ids,
      file_list: formData.file_list,
      sheet: formData.sheet,
      import_action: formData.import_action,
    });
  }, [completeCaseType, dataCollectionsMapQuery.map, onProceed, rawData]);

  const loadables = useArray([
    caseTypesQuery,
    caseTypeOptionsQuery,
    dataCollectionOptionsQuery,
    dataCollectionsMapQuery,
    caseTypeColsQuery,
  ]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (

    <ResponseHandler
      inlineSpinner
      error={completeCaseTypeError}
      loadables={loadables}
    >
      <Container maxWidth={'lg'}>
        <GenericForm<FormFields>
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={handleSubmit(onFormSubmit)}
        />
        {rawData && rawData.length > 0 && (
          <Alert
            severity={'info'}
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {t('{{fileName}} loaded successfully', { fileName: userSelectedFile?.[0]?.name || '' })}
            </AlertTitle>
            {userSelectedSheet !== EpiUploadUtil.csvSheetId && (
              <Typography>
                {t('Sheet name: {{sheetName}}', { sheetName: userSelectedSheet || '' })}
              </Typography>
            )}
            <Typography>
              {t('Number of columns: {{columnCount}}', { columnCount: rawData[0].length })}
            </Typography>
            <Typography>
              {t('Number of data rows: {{rowCount}}', { rowCount: rawData.length - 1 })}
            </Typography>
          </Alert>
        )}
        <EpiUploadNavigation
          onProceedButtonClick={onProceedButtonClick}
        />
      </Container>
    </ResponseHandler>
  );
};

export default EpiUploadSelectFile;
