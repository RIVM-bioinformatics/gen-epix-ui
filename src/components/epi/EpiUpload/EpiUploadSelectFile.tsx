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
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { useArray } from '../../../hooks/useArray';
import { GenericForm } from '../../form/helpers/GenericForm';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { useCaseTypeColsQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';

type FormFields = {
  caseTypeId: string;
  createdInDataCollectionId: string;
  fileList: unknown;
  sheet: string;
};

const EpiUploadSelectFile = () => {
  const { t } = useTranslation();
  const caseTypesQuery = useCaseTypesQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const caseTypeColsQuery = useCaseTypeColsQuery();
  const formId = useId();

  const store = useContext(EpiUploadStoreContext);

  const caseTypeId = useStore(store, (state) => state.caseTypeId);
  const fileList = useStore(store, (state) => state.fileList);
  const fileName = useStore(store, (state) => state.fileName);
  const fileParsingError = useStore(store, (state) => state.fileParsingError);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const createdInDataCollectionOptions = useStore(store, (state) => state.createdInDataCollectionOptions);
  const rawData = useStore(store, (state) => state.rawData);
  const setCaseTypeCols = useStore(store, (state) => state.setCaseTypeCols);
  const setCaseTypeId = useStore(store, (state) => state.setCaseTypeId);
  const setCompleteCaseType = useStore(store, (state) => state.setCompleteCaseType);
  const setCreatedInDataCollectionId = useStore(store, (state) => state.setCreatedInDataCollectionId);
  const setFileList = useStore(store, (state) => state.setFileList);
  const setSheet = useStore(store, (state) => state.setSheet);
  const setDataCollectionOptions = useStore(store, (state) => state.setDataCollectionOptions);
  const sheet = useStore(store, (state) => state.sheet);
  const sheetOptions = useStore(store, (state) => state.sheetOptions);

  const schema = useMemo(() => object<FormFields>().shape({
    caseTypeId: string().uuid4().required(),
    createdInDataCollectionId: string().uuid4().required(),
    fileList: mixed().required(t`File is required`),
    sheet: string().required(t`Sheet is required`),
  }), [t]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: {
      caseTypeId: null,
      createdInDataCollectionId: null,
      fileList: null,
      sheet: null,
    },
    values: {
      caseTypeId: store.getState().caseTypeId ?? null,
      createdInDataCollectionId: store.getState().createdInDataCollectionId ?? null,
      fileList: store.getState().fileList ?? null,
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
        return (await CaseApi.instance.completeCaseTypesGetOne(caseTypeId, { signal })).data;
      },
      enabled: !!caseTypeId,
    },
  });

  useEffect(() => {
    if (completeCaseType) {
      setCompleteCaseType(completeCaseType);
    }
  }, [completeCaseType, setCompleteCaseType]);

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

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [
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
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
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
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          name: 'createdInDataCollectionId',
          label: t`Create in data collection`,
          options: createdInDataCollectionOptions,
          loading: dataCollectionOptionsQuery.isLoading || isCompleteCaseTypeLoading,
          disabled: !fileList || !caseTypeId,
          onChange: onCreatedInDataCollectionIdChange,
        } as const satisfies FormFieldDefinition<FormFields>,
    ] as const);

    return fields;
  }, [t, onFileListChange, fileName, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, fileList, onCaseTypeIdChange, createdInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, caseTypeId, onCreatedInDataCollectionIdChange, sheetOptions, onSheetChange]);

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
    if (caseTypeColsQuery.isLoading === false && caseTypeColsQuery.data?.length === 0) {
      return false;
    }
    if (caseTypeOptionsQuery.isLoading === false && caseTypeOptionsQuery.options?.length === 0) {
      return false;
    }
    if (dataCollectionOptionsQuery.isLoading === false && dataCollectionOptionsQuery.options?.length === 0) {
      return false;
    }
    return true;
  }, [caseTypeColsQuery.data?.length, caseTypeColsQuery.isLoading, caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options?.length, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options?.length]);

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
            <GenericForm<FormFields>
              formFieldDefinitions={formFieldDefinitions}
              formId={formId}
              formMethods={formMethods}
              schema={schema}
              onSubmit={handleSubmit(onFormSubmit)}
            />
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
