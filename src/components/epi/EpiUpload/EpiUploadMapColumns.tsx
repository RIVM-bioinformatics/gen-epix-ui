import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import uniq from 'lodash/uniq';
import { useStore } from 'zustand';
import difference from 'lodash/difference';

import { type FormFieldDefinition } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { useCaseTypeColMapQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type { EpiUploadMappedColumnsFormFields } from '../../../models/epiUpload';
import { useIdentifierIssuerOptionsQuery } from '../../../dataHooks/useIdentifierIssuerQuery';
import { Select } from '../../form/fields/Select';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadMapColumns = () => {
  const [t] = useTranslation();
  const caseTypeColMap = useCaseTypeColMapQuery();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();

  const store = useContext(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const rawData = useStore(store, (state) => state.rawData);
  const fileName = useStore(store, (state) => state.fileName);
  const importAction = useStore(store, (state) => state.importAction);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setMappedColumns = useStore(store, (state) => state.setMappedColumns);

  const loadables = useArray([
    caseTypeColMap,
    identifierIssuerOptionsQuery,
  ]);

  const columnMappingFormId = useId();
  // const identifierIssuerMappingFormId = useId();

  const schema = useMemo(() => {
    return EpiUploadUtil.getColumnMappingSchema(rawData, completeCaseType, importAction);
  }, [completeCaseType, importAction, rawData]);

  const defaultValues: EpiUploadMappedColumnsFormFields = useMemo(() => {
    return EpiUploadUtil.getDefaultColumnMappingFormValues(rawData[0], store.getState().mappedColumns, importAction);
  }, [rawData, store, importAction]);

  const formMethods = useForm<EpiUploadMappedColumnsFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadMappedColumnsFormFields>,
    values: { ...defaultValues },
    defaultValues: { ...defaultValues },
  });

  const { handleSubmit, control, clearErrors } = formMethods;
  const columnMappingFormValues = useWatch({ control });

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadMappedColumnsFormFields>[]>(() => {
    return EpiUploadUtil.getColumnMappingFormFieldDefinitions(completeCaseType, rawData[0], fileName, importAction).map(def => ({
      ...def,
      onChange: () => clearErrors(),
    }));
  }, [completeCaseType, rawData, fileName, importAction, clearErrors]);

  useEffect(() => {
    const perform = async () => {
      await setMappedColumns(EpiUploadUtil.getMappedColumnsFromFormData(columnMappingFormValues, rawData, caseTypeColMap.map, completeCaseType));
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [setMappedColumns, columnMappingFormValues, rawData, caseTypeColMap.map, completeCaseType]);

  const unMappedColumns = useMemo(() => {
    const knownIndicies = rawData[0].map((_col, index) => index);
    const mappedIndicies = EpiUploadUtil.getMappedColumnsFromFormData(columnMappingFormValues, rawData, caseTypeColMap.map, completeCaseType).map(col => col.originalIndex);
    return difference(knownIndicies, mappedIndicies).map(index => {
      return {
        originalIndex: index,
        originalLabel: rawData[0][index],
      };
    });
  }, [caseTypeColMap.map, rawData, columnMappingFormValues, completeCaseType]);

  const onFormSubmit = useCallback(async (data: EpiUploadMappedColumnsFormFields) => {
    await setMappedColumns(EpiUploadUtil.getMappedColumnsFromFormData(data, rawData, caseTypeColMap.map, completeCaseType));
    await goToNextStep();
  }, [rawData, caseTypeColMap.map, goToNextStep, setMappedColumns, completeCaseType]);

  const sampleIdCaseTypeColIds = useMemo(() => {
    return EpiUploadUtil.getSampleIdCaseTypeColIds(completeCaseType);
  }, [completeCaseType]);

  const renderField = useCallback((definition: FormFieldDefinition<EpiUploadMappedColumnsFormFields>, element: ReactElement) => {
    const columnIndexInRawData = parseInt(definition.name, 10);
    const columnValues = uniq(rawData.slice(1).map((row) => row[columnIndexInRawData] ?? '')).filter(x => !!x);
    const firstFiveValuesString = columnValues.slice(0, 5).join(', ').trim() || t('<no data>');

    let elementWithIssuer = element;
    const fieldValue = columnMappingFormValues[definition.name];
    if (sampleIdCaseTypeColIds.includes(fieldValue)) {
      elementWithIssuer = (
        <>
          <Box>
            {element}
          </Box>
          <Box marginTop={1}>
            <Select
              label={t('{{columnLabel}}: Identifier issuer', { columnLabel: definition.label })}
              name={fieldValue}
              options={identifierIssuerOptionsQuery.options}
              loading={identifierIssuerOptionsQuery.isLoading}
            />
          </Box>
        </>
      );
    }

    return (
      <TableRow key={definition.name}>
        <TableCell>
          {definition.label}
        </TableCell>
        <TableCell>
          {elementWithIssuer}
        </TableCell>
        <TableCell>
          {firstFiveValuesString}
        </TableCell>
      </TableRow>
    );
  }, [columnMappingFormValues, identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, rawData, sampleIdCaseTypeColIds, t]);

  const wrapForm = useCallback((children: ReactElement) => {
    return (
      <Table
        size={'small'}
      >
        <TableHead
          sx={{
            position: 'sticky',
            top: 0,
            backgroundColor: (theme) => theme.palette.background.paper,
            zIndex: (theme) => theme.zIndex.appBar - 1,
          }}
        >
          <TableRow>
            <TableCell sx={{ width: '33%' }}>
              {t`Source`}
            </TableCell>
            <TableCell sx={{ width: '33%' }}>
              {ConfigManager.instance.config.applicationName}
            </TableCell>
            <TableCell sx={{ width: '34%' }}>
              {t`Data preview (first 5 unique values)`}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {children}
        </TableBody>
      </Table>
    );
  }, [t]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (
    <ResponseHandler loadables={loadables}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: 'max-content auto max-content',
          height: '100%',
        }}
      >
        <Container
          maxWidth={'lg'}
          sx={{
            marginBottom: 2,
          }}
        >
          <Alert severity={unMappedColumns.length === 0 ? 'info' : 'warning'}>
            <AlertTitle>
              {unMappedColumns.length === 0 ?
                t('All columns in {{fileName}} have been mapped to known columns in {{applicationName}}', { fileName, applicationName: ConfigManager.instance.config.applicationName })
                : t('{{numUnmappedColumns}} column(s) in {{fileName}} are not mapped', { numUnmappedColumns: unMappedColumns.length, fileName })}
            </AlertTitle>
            {unMappedColumns.map((col) => (
              <Box key={col.originalIndex}>
                {t('The column "{{columnName}}" (column {{columnIndex}}) has not been mapped.', { columnName: col.originalLabel, columnIndex: col.originalIndex + 1 })}
              </Box>
            ))}
            {unMappedColumns.length === 0 && t('You can proceed to the next step.')}
          </Alert>
        </Container>
        <Box
          sx={{
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <Container>
              <GenericForm<EpiUploadMappedColumnsFormFields>
                formFieldDefinitions={formFieldDefinitions}
                formId={columnMappingFormId}
                formMethods={formMethods}
                renderField={renderField}
                wrapForm={wrapForm}
                schema={schema}
                onSubmit={handleSubmit(onFormSubmit)}
              />
            </Container>
          </Box>
        </Box>
        <Box>
          <EpiUploadNavigation
            onGoBackButtonClick={goToPreviousStep}
            onProceedButtonClick={onProceedButtonClick}
          />
        </Box>
      </Box>
    </ResponseHandler>
  );
};
