import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  array,
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
import { useStore } from 'zustand';

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
import { useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { useCaseTypeColsQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { NotificationManager } from '../../../classes/managers/NotificationManager';

import { EpiUploadNavigation } from './EpiUploadNavigation';

type FormFields = {
  importAction: EPI_UPLOAD_ACTION;
  caseTypeId: string;
  createdInDataCollectionId: string;
  shareInDataCollectionIds: string[];
  fileList: FileList;
  sheet: string;
};

const EpiUploadSelectFile = () => {
  const [t] = useTranslation();
  const caseTypesQuery = useCaseTypesQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const caseTypeColsQuery = useCaseTypeColsQuery();
  const formId = useId();

  const store = useContext(EpiUploadStoreContext);

  const caseTypeId = useStore(store, (state) => state.caseTypeId);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const fileList = useStore(store, (state) => state.fileList);
  const fileName = useStore(store, (state) => state.fileName);
  const fileParsingError = useStore(store, (state) => state.fileParsingError);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const importAction = useStore(store, (state) => state.importAction);
  const invalidateCaseValidationQuery = useStore(store, (state) => state.invalidateCaseValidationQuery);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const rawData = useStore(store, (state) => state.rawData);
  const setCaseTypeCols = useStore(store, (state) => state.setCaseTypeCols);
  const setCaseTypeId = useStore(store, (state) => state.setCaseTypeId);
  const setCompleteCaseType = useStore(store, (state) => state.setCompleteCaseType);
  const setCreatedInDataCollectionId = useStore(store, (state) => state.setCreatedInDataCollectionId);
  const setFileList = useStore(store, (state) => state.setFileList);
  const setMappedColumns = useStore(store, (state) => state.setMappedColumns);
  const setShareInDataCollectionIds = useStore(store, (state) => state.setShareInDataCollectionIds);
  const setSheet = useStore(store, (state) => state.setSheet);
  const setImportAction = useStore(store, (state) => state.setImportAction);
  const setDataCollectionOptions = useStore(store, (state) => state.setDataCollectionOptions);
  const sheet = useStore(store, (state) => state.sheet);
  const sheetOptions = useStore(store, (state) => state.sheetOptions);

  const oldValues = useMemo(() => {
    const state = store.getState();
    return {
      caseTypeId: state.caseTypeId,
      completeCaseType: state.completeCaseType,
      createdInDataCollectionId: state.createdInDataCollectionId,
      fileList: state.fileList,
      importAction: state.importAction,
      shareInDataCollectionIds: state.shareInDataCollectionIds,
      sheet: state.sheet,
    };
  }, [store]);

  const schema = useMemo(() => object<FormFields>().shape({
    caseTypeId: string().uuid4().required(),
    createdInDataCollectionId: string().uuid4().required(),
    fileList: mixed().required(t`File is required`),
    importAction: mixed<EPI_UPLOAD_ACTION>().oneOf(Object.values(EPI_UPLOAD_ACTION)).required(),
    shareInDataCollectionIds: array().of(string().uuid4()),
    sheet: string().required(t`Sheet is required`),
  }), [t]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: {
      caseTypeId: null,
      createdInDataCollectionId: null,
      fileList: null,
      importAction: EPI_UPLOAD_ACTION.CREATE,
      shareInDataCollectionIds: [],
      sheet: null,
    },
    values: {
      caseTypeId: store.getState().caseTypeId ?? null,
      createdInDataCollectionId: store.getState().createdInDataCollectionId ?? null,
      fileList: store.getState().fileList ?? null,
      importAction: store.getState().importAction ?? EPI_UPLOAD_ACTION.CREATE,
      shareInDataCollectionIds: store.getState().shareInDataCollectionIds ?? [],
      sheet: store.getState().sheet ?? null,
    },
  });
  const { handleSubmit, setValue, setError } = formMethods;

  useEffect(() => {
    if (caseTypeColsQuery?.data?.length) {
      setCaseTypeCols(caseTypeColsQuery.data);
    }
  }, [caseTypeColsQuery.data, setCaseTypeCols]);

  useEffect(() => {
    if (dataCollectionOptionsQuery?.options?.length) {
      setDataCollectionOptions(dataCollectionOptionsQuery.options);
    }
  }, [dataCollectionOptionsQuery?.options, setDataCollectionOptions]);

  const { isLoading: isCompleteCaseTypeLoading, error: completeCaseTypeError, data: completeCaseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseApi.getInstance().completeCaseTypesGetOne(caseTypeId, { signal })).data;
      },
      enabled: !!caseTypeId,
    },
  });

  const createdInDataCollectionOptions = useMemo<AutoCompleteOption[]>(() => {
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

  const createOrUpdateOptions = useMemo<AutoCompleteOption[]>(() => ([
    { label: t('Create new cases'), value: EPI_UPLOAD_ACTION.CREATE },
    { label: t('Update existing cases'), value: EPI_UPLOAD_ACTION.UPDATE },
  ]), [t]);

  const onImportActionsChange = useCallback((value: unknown) => {
    setImportAction(value as EPI_UPLOAD_ACTION);
  }, [setImportAction]);

  const onFileListChange = useCallback(async (value: FileList) => {
    await setFileList(value);
  }, [setFileList]);

  const onSheetChange = useCallback(async (value: unknown) => {
    await setSheet(value as string);
  }, [setSheet]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP,
          name: 'importAction',
          label: t`Import action`,
          options: createOrUpdateOptions,
          onChange: onImportActionsChange,
          row: true,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.FILE,
          name: 'fileList',
          label: t`File`,
          accept: '.csv,.tsv,.txt,.xlsx',
          onChange: onFileListChange,
        } as const satisfies FormFieldDefinition<FormFields>,
    ];

    if (EpiUploadUtil.isXlsxFile(fileName)) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'sheet',
        label: t`Sheet`,
        options: sheetOptions,
        onChange: onSheetChange,
      } as const satisfies FormFieldDefinition<FormFields>);
    }

    fields.push(...[
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'caseTypeId',
          label: t`Case type`,
          options: caseTypeOptionsQuery.options,
          loading: caseTypeOptionsQuery.isLoading,
          disabled: !fileList,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'createdInDataCollectionId',
          label: t`Create in data collection`,
          options: createdInDataCollectionOptions,
          loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
          disabled: !fileList || !caseTypeId,
        } as const satisfies FormFieldDefinition<FormFields>,
    ] as const);

    if (importAction === EPI_UPLOAD_ACTION.CREATE) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'shareInDataCollectionIds',
        label: t`Share in data collections`,
        options: shareInDataCollectionOptions,
        loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
        disabled: !createdInDataCollectionId,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>);
    }
    return fields;
  }, [t, createOrUpdateOptions, onImportActionsChange, onFileListChange, fileName, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, fileList, createdInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, caseTypeId, importAction, sheetOptions, onSheetChange, shareInDataCollectionOptions, createdInDataCollectionId]);

  useEffect(() => {
    if (fileParsingError) {
      setError('fileList', { type: 'manual', message: fileParsingError });
    } else {
      setError('fileList', undefined);
    }
  }, [fileParsingError, setError, setValue]);

  useEffect(() => {
    if (!rawData || caseTypeColsQuery.isLoading || !caseTypeColsQuery.data?.length) {
      return;
    }
    const bestMatchingCaseType = EpiUploadUtil.getCaseTypeFromColumnLabels(caseTypeColsQuery.data, rawData[0]);
    if (bestMatchingCaseType) {
      setValue('caseTypeId', bestMatchingCaseType.id, {
        shouldTouch: true,
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [caseTypeColsQuery.data, caseTypeColsQuery.isLoading, rawData, setValue]);


  useEffect(() => {
    if (dataCollectionOptionsQuery.isLoading || !createdInDataCollectionOptions?.length) {
      return;
    }

    if (createdInDataCollectionOptions?.length === 1) {
      setValue('createdInDataCollectionId', createdInDataCollectionOptions[0].value as string, {
        shouldTouch: true,
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [createdInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, setValue]);

  const onFormSubmit = useCallback(async (formData: FormFields) => {
    const newValues = {
      caseTypeId: formData.caseTypeId,
      completeCaseType,
      createdInDataCollectionId: formData.createdInDataCollectionId,
      fileList: formData.fileList,
      importAction: formData.importAction,
      shareInDataCollectionIds: formData.shareInDataCollectionIds,
      sheet: formData.sheet,
    };
    if (JSON.stringify(oldValues) !== JSON.stringify(newValues)) {
      await invalidateCaseValidationQuery();
    }
    if (mappedColumns) {
      if (!EpiUploadUtil.areMappedColumnsEqual(mappedColumns, EpiUploadUtil.getInitialMappedColumns(completeCaseType, rawData, formData.importAction))) {
        NotificationManager.instance.showNotification({
          message: t`Column mappings have been reset due to changes in the selected case type or file.`,
          severity: 'info',
          isLoading: false,
        });
        await setMappedColumns([]);
      }
    }
    setCaseTypeId(formData.caseTypeId);
    setCompleteCaseType(completeCaseType);
    setCreatedInDataCollectionId(formData.createdInDataCollectionId);
    await setFileList(formData.fileList);
    setShareInDataCollectionIds(formData.shareInDataCollectionIds);
    await setSheet(formData.sheet);
    goToNextStep();
  }, [completeCaseType, goToNextStep, invalidateCaseValidationQuery, mappedColumns, oldValues, rawData, setCaseTypeId, setCompleteCaseType, setCreatedInDataCollectionId, setFileList, setMappedColumns, setShareInDataCollectionIds, setSheet, t]);

  const loadables = useArray([
    caseTypesQuery,
    caseTypeOptionsQuery,
    dataCollectionOptionsQuery,
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
              {t('{{fileName}} loaded successfully', { fileName })}
            </AlertTitle>
            {sheet && (
              <Typography>
                {t('Sheet name: {{sheet}}', { sheet: sheet || '' })}
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
