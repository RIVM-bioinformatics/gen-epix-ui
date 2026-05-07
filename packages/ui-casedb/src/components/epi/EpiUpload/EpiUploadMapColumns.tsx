import type { ReactElement } from 'react';
import {
  use,
  useCallback,
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
import type { FormFieldDefinition } from '@gen-epix/ui';
import {
  ConfigManager,
  GenericForm,
  ResponseHandler,
  Select,
  useArray,
  useIdentifierIssuerOwnOrganizationOptionsQuery,
} from '@gen-epix/ui';

import { useColMapQuery } from '../../../dataHooks/useColsQuery';
import type { EpiUploadMappedColumnsFormFields } from '../../../models/epi';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadMapColumns = () => {
  const { t } = useTranslation();
  const colMap = useColMapQuery();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOwnOrganizationOptionsQuery();

  const store = use(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const rawData = useStore(store, (state) => state.rawData);
  const fileName = useStore(store, (state) => state.fileName);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setMappedColumns = useStore(store, (state) => state.setMappedColumns);

  const loadables = useArray([
    colMap,
    identifierIssuerOptionsQuery,
  ]);

  const columnMappingFormId = useId();
  // const identifierIssuerMappingFormId = useId();

  const schema = useMemo(() => {
    return EpiUploadUtil.getColumnMappingSchema(rawData, completeCaseType);
  }, [completeCaseType, rawData]);

  const defaultValues: EpiUploadMappedColumnsFormFields = useMemo(() => {
    return EpiUploadUtil.getDefaultColumnMappingFormValues(rawData[0], store.getState().mappedColumns, identifierIssuerOptionsQuery.options);
  }, [rawData, store, identifierIssuerOptionsQuery.options]);

  const formMethods = useForm<EpiUploadMappedColumnsFormFields>({
    defaultValues: { ...defaultValues },
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadMappedColumnsFormFields>,
    values: { ...defaultValues },
  });

  const { clearErrors, control, handleSubmit } = formMethods;
  const columnMappingFormValues = useWatch({ control });

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadMappedColumnsFormFields>[]>(() => {
    return EpiUploadUtil.getColumnMappingFormFieldDefinitions(completeCaseType, rawData[0], fileName).map(def => ({
      ...def,
      onChange: () => clearErrors(),
    }));
  }, [completeCaseType, rawData, fileName, clearErrors]);

  useEffect(() => {
    const perform = async () => {
      await setMappedColumns(EpiUploadUtil.getMappedColumnsFromFormData(columnMappingFormValues, rawData, colMap.map, completeCaseType));
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [setMappedColumns, columnMappingFormValues, rawData, colMap.map, completeCaseType]);

  const unMappedColumns = useMemo(() => {
    const knownIndicies = rawData[0].map((_col, index) => index);
    const mappedIndicies = EpiUploadUtil.getMappedColumnsFromFormData(columnMappingFormValues, rawData, colMap.map, completeCaseType).map(mappedColumn => mappedColumn.originalIndex);
    return difference(knownIndicies, mappedIndicies).map(index => {
      return {
        originalIndex: index,
        originalLabel: rawData[0][index],
      };
    });
  }, [colMap.map, rawData, columnMappingFormValues, completeCaseType]);

  const onFormSubmit = useCallback(async (data: EpiUploadMappedColumnsFormFields) => {
    await setMappedColumns(EpiUploadUtil.getMappedColumnsFromFormData(data, rawData, colMap.map, completeCaseType));
    await goToNextStep();
  }, [rawData, colMap.map, goToNextStep, setMappedColumns, completeCaseType]);

  const sampleIdColIds = useMemo(() => {
    return EpiUploadUtil.getSampleIdColIds(completeCaseType);
  }, [completeCaseType]);

  const renderField = useCallback((definition: FormFieldDefinition<EpiUploadMappedColumnsFormFields>, element: ReactElement) => {
    const columnIndexInRawData = parseInt(definition.name, 10);
    const columnValues = uniq(rawData.slice(1).map((row) => row[columnIndexInRawData] ?? '')).filter(x => !!x);
    const firstFiveValuesString = columnValues.slice(0, 5).join(', ').trim() || t('<no data>');

    let elementWithIssuer = element;
    const fieldValue = columnMappingFormValues[definition.name];
    if (sampleIdColIds.includes(fieldValue)) {
      elementWithIssuer = (
        <>
          <Box>
            {element}
          </Box>
          <Box
            sx={{
              marginTop: 1,
            }}
          >
            <Select
              label={t('{{columnLabel}}: Identifier issuer', { columnLabel: definition.label })}
              loading={identifierIssuerOptionsQuery.isLoading}
              name={fieldValue}
              options={identifierIssuerOptionsQuery.options}
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
  }, [columnMappingFormValues, identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, rawData, sampleIdColIds, t]);

  const wrapForm = useCallback((children: ReactElement) => {
    return (
      <Table
        size={'small'}
      >
        <TableHead
          sx={{
            backgroundColor: (theme) => theme.palette.background.paper,
            position: 'sticky',
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar - 1,
          }}
        >
          <TableRow>
            <TableCell sx={{ width: '33%' }}>
              {t`Source`}
            </TableCell>
            <TableCell sx={{ width: '33%' }}>
              {ConfigManager.getInstance().config.applicationName}
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

  const onGoBackButtonClick = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

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
                t('All columns in {{fileName}} have been mapped to known columns in {{applicationName}}', { applicationName: ConfigManager.getInstance().config.applicationName, fileName })
                : t('{{numUnmappedColumns}} column(s) in {{fileName}} are not mapped', { fileName, numUnmappedColumns: unMappedColumns.length })}
            </AlertTitle>
            {unMappedColumns.map((unmappedColumn) => (
              <Box key={unmappedColumn.originalIndex}>
                {t('The column "{{columnName}}" (column {{columnIndex}}) has not been mapped.', { columnIndex: unmappedColumn.originalIndex + 1, columnName: unmappedColumn.originalLabel })}
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
              bottom: 0,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            <Container>
              <GenericForm<EpiUploadMappedColumnsFormFields>
                formFieldDefinitions={formFieldDefinitions}
                formId={columnMappingFormId}
                formMethods={formMethods}
                onSubmit={handleSubmit(onFormSubmit)}
                renderField={renderField}
                schema={schema}
                wrapForm={wrapForm}
              />
            </Container>
          </Box>
        </Box>
        <Box>
          <EpiUploadNavigation
            onGoBackButtonClick={onGoBackButtonClick}
            onProceedButtonClick={onProceedButtonClick}
          />
        </Box>
      </Box>
    </ResponseHandler>
  );
};
