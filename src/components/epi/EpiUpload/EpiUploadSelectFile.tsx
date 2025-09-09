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
import { parse } from 'csv/browser/esm/sync';
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
  Box,
  Button,
} from '@mui/material';
import readXlsxFile, { readSheetNames } from 'read-excel-file';

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
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import type { EpiUploadSelectFileResult } from '../../../models/epiUpload';

type FormFields = {
  case_type_id: string;
  create_in_data_collection_id: string;
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

  const schema = useMemo(() => object<FormFields>().shape({
    case_type_id: string().uuid4().required(),
    file_list: mixed().required(t`File is required`),
    create_in_data_collection_id: string().uuid4().required(),
    sheet: string().required(t`Sheet is required`),
  }), [t]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: {
      case_type_id: null,
      create_in_data_collection_id: null,
      file_list: null,
      sheet: null,
    },
    values: {
      ...defaultValues,
    },
  });
  const { handleSubmit, setValue, setError } = formMethods;
  const { control } = formMethods;
  const { case_type_id: userSelectedCaseTypeId, file_list: userSelectedFile, sheet: userSelectedSheet } = useWatch({ control });
  const [ sheetOptions, setSheetOptions] = useState<AutoCompleteOption[]>([]);
  const [rawData, setRawData] = useState<string[][] | null>(null);


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

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.FILE,
          name: 'file_list',
          label: t`File`,
          accept: '.csv,.xlsx',
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'sheet',
          label: t`Sheet`,
          options: sheetOptions,
          disabled: !userSelectedFile || !sheetOptions.length || !userSelectedFile?.[0]?.name.toLowerCase().endsWith('.xlsx'),
        } as const satisfies FormFieldDefinition<FormFields>,
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
    ] as const;
  }, [t, sheetOptions, userSelectedFile, caseTypeOptionsQuery.options, caseTypeOptionsQuery.isLoading, createInDataCollectionOptions, dataCollectionOptionsQuery.isLoading, isCompleteCaseTypeLoading, userSelectedCaseTypeId]);

  useEffect(() => {
    if (fileParsingError) {
      setError('file_list', { type: 'manual', message: fileParsingError });
    } else {
      setError('file_list', undefined);
    }
  }, [fileParsingError, setError]);

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
        const file = userSelectedFile[0];
        const fileName = file.name.toLowerCase();

        if (fileName.toLowerCase().endsWith('.xlsx')) {
          const sheetNames = await readSheetNames(file);
          setSheetOptions(() => sheetNames.map(name => ({ label: name, value: name })));
          if (sheetNames.length === 1) {
            setValue('sheet', sheetNames[0]);
          }
          return;
        }
        setSheetOptions([{ label: 'CSV', value: sheetId }]);
        setValue('sheet', sheetId);
      } catch (_error) {
        setValue('sheet', null);
        setValue('file_list', null);
        setFileParsingError(t`Error reading sheet names from file`);
      }
    };
    void perform();
  }, [setValue, sheetId, t, userSelectedFile]);

  useEffect(() => {
    const perform = async (): Promise<void> => {
      if (!userSelectedFile?.[0] || !userSelectedSheet) {
        return;
      }
      setFileParsingError(null);
      const file = userSelectedFile[0];
      const fileName = file.name.toLowerCase();

      try {
        let parsedData: string[][];

        if (fileName.endsWith('.csv')) {
        // Parse CSV file
          const text = await file.text();
          parsedData = parse(text, {
            columns: false, // Keep as array of arrays
            skip_empty_lines: true,
            trim: true,
          });
        } else if (fileName.endsWith('.xlsx')) {
          if (userSelectedSheet === sheetId) {
            // allow a render cycle to complete
            return;
          }
          // Parse Excel file
          const excelData = await readXlsxFile(file, {
            sheet: userSelectedSheet || undefined,
          });
          // Convert CellValue[][] to string[][]
          parsedData = excelData.map(row => row.map(cell => cell?.toString() || ''));
        } else {
          throw new Error('Unsupported file format. Please select a CSV or Excel file.');
        }

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
    const bestMatchingCaseType = EpiCaseTypeUtil.getCaseTypeFromColumnLabels(caseTypeColsQuery.data, rawData[0]);
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
    console.log(formData.file_list[0]);
    onProceed({
      completeCaseType,
      createInDataCollection: dataCollectionsMapQuery.map.get(formData.create_in_data_collection_id),
      rawData,
      case_type_id: formData.case_type_id,
      create_in_data_collection_id: formData.create_in_data_collection_id,
      file_list: formData.file_list,
      sheet: formData.sheet,
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
      <GenericForm<FormFields>
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
          variant={'contained'}
          onClick={onProceedButtonClick}
        >
          {t('Save & proceed')}
        </Button>
      </Box>
    </ResponseHandler>
  );
};

export default EpiUploadSelectFile;
