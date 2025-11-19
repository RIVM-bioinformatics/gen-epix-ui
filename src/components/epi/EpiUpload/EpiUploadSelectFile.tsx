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
  const createdInDataCollectionOptions = useStore(store, (state) => state.createdInDataCollectionOptions);
  const shareInDataCollectionOptions = useStore(store, (state) => state.shareInDataCollectionOptions);
  const rawData = useStore(store, (state) => state.rawData);
  const setCaseTypeCols = useStore(store, (state) => state.setCaseTypeCols);
  const setCaseTypeId = useStore(store, (state) => state.setCaseTypeId);
  const setCompleteCaseType = useStore(store, (state) => state.setCompleteCaseType);
  const setCreatedInDataCollectionId = useStore(store, (state) => state.setCreatedInDataCollectionId);
  const setFileList = useStore(store, (state) => state.setFileList);
  const setShareInDataCollectionIds = useStore(store, (state) => state.setShareInDataCollectionIds);
  const setSheet = useStore(store, (state) => state.setSheet);
  const setImportAction = useStore(store, (state) => state.setImportAction);
  const setDataCollectionOptions = useStore(store, (state) => state.setDataCollectionOptions);
  const sheet = useStore(store, (state) => state.sheet);
  const sheetOptions = useStore(store, (state) => state.sheetOptions);

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
    if (Array.isArray(caseTypeColsQuery?.data)) {
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

  useEffect(() => {
    if (completeCaseType) {
      setCompleteCaseType(completeCaseType);
    }
  }, [completeCaseType, setCompleteCaseType]);

  const createOrUpdateOptions = useMemo<AutoCompleteOption[]>(() => ([
    { label: t('Create new cases'), value: EPI_UPLOAD_ACTION.CREATE },
    { label: t('Update existing cases'), value: EPI_UPLOAD_ACTION.UPDATE },
  ]), [t]);

  const onImportActionsChange = useCallback(async (value: unknown) => {
    await setImportAction(value as EPI_UPLOAD_ACTION);
  }, [setImportAction]);

  const onFileListChange = useCallback(async (value: FileList) => {
    await setFileList(value);
  }, [setFileList]);

  const onSheetChange = useCallback(async (value: unknown) => {
    await setSheet(value as string);
  }, [setSheet]);

  const onCaseTypeIdChange = useCallback((value: unknown) => {
    setCaseTypeId(value as string);
  }, [setCaseTypeId]);

  const onCreatedInDataCollectionIdChange = useCallback((value: unknown) => {
    setCreatedInDataCollectionId(value as string);
  }, [setCreatedInDataCollectionId]);

  const onShareInDataCollectionIdsChange = useCallback((value: unknown) => {
    setShareInDataCollectionIds(value as string[]);
  }, [setShareInDataCollectionIds]);

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
          onChange: onCaseTypeIdChange,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'createdInDataCollectionId',
          label: t`Create in data collection`,
          options: createdInDataCollectionOptions,
          loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
          disabled: !fileList || !caseTypeId,
          onChange: onCreatedInDataCollectionIdChange,
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
        onChange: onShareInDataCollectionIdsChange,
      } as const satisfies FormFieldDefinition<FormFields>);
    }
    return fields;
  }, [t, createOrUpdateOptions, onImportActionsChange, onFileListChange, fileName, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, fileList, onCaseTypeIdChange, createdInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, caseTypeId, onCreatedInDataCollectionIdChange, importAction, sheetOptions, onSheetChange, shareInDataCollectionOptions, createdInDataCollectionId, onShareInDataCollectionIdsChange]);

  useEffect(() => {
    if (fileParsingError) {
      setError('fileList', { type: 'manual', message: fileParsingError });
    } else {
      setError('fileList', undefined);
    }
  }, [fileParsingError, setError, setValue]);

  const onFormSubmit = useCallback(async () => {
    await goToNextStep();
  }, [goToNextStep]);

  const loadables = useArray([
    caseTypesQuery,
    caseTypeOptionsQuery,
    dataCollectionOptionsQuery,
    caseTypeColsQuery,
  ]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  const canUpload = useMemo(() => {
    if (caseTypeColsQuery.isLoading === false && caseTypeColsQuery.data.length === 0) {
      return false;
    }
    if (caseTypeOptionsQuery.isLoading === false && caseTypeOptionsQuery.options.length === 0) {
      return false;
    }
    if (dataCollectionOptionsQuery.isLoading === false && dataCollectionOptionsQuery.options.length === 0) {
      return false;
    }
    return true;
  }, [caseTypeColsQuery.data.length, caseTypeColsQuery.isLoading, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options.length, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options.length]);

  return (

    <ResponseHandler
      inlineSpinner
      error={completeCaseTypeError}
      loadables={loadables}
    >
      <Container maxWidth={'lg'}>
        {!canUpload && (
          <Alert
            severity={'warning'}
            sx={{ mb: 2 }}
          >
            {t('Upload is disabled because you have insufficient data access to proceed. Contact your organization administrator for assistance.')}
          </Alert>
        )}
        {canUpload && (
          <>
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
          </>
        )}

      </Container>
    </ResponseHandler>
  );
};

export default EpiUploadSelectFile;
