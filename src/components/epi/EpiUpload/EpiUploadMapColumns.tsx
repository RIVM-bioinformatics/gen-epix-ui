import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
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
import invert from 'lodash/invert';
import uniq from 'lodash/uniq';
import { useStore } from 'zustand';

import type { CaseTypeCol } from '../../../api';
import type { FormFieldDefinition } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { useCaseTypeColMapQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import {
  EPI_UPLOAD_ACTION,
  type EpiUploadMappedColumnsFormFields,
} from '../../../models/epiUpload';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadMapColumns = () => {
  const [t] = useTranslation();
  const caseTypeColMap = useCaseTypeColMapQuery();

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
  ]);

  const formId = useId();

  const schema = useMemo(() => {
    return EpiUploadUtil.getSchema(rawData, completeCaseType, t, importAction);
  }, [completeCaseType, importAction, rawData, t]);

  const defaultValues: EpiUploadMappedColumnsFormFields = useMemo(() => {
    return EpiUploadUtil.getDefaultFormValues(completeCaseType, store.getState().mappedColumns, importAction);
  }, [completeCaseType, store, importAction]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadMappedColumnsFormFields>[]>(() => {
    return EpiUploadUtil.getColumnMappingFormFieldDefinitions(completeCaseType, rawData[0], fileName, importAction);
  }, [completeCaseType, rawData, fileName, importAction]);

  const formMethods = useForm<EpiUploadMappedColumnsFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadMappedColumnsFormFields>,
    values: { ...defaultValues },
    defaultValues: { ...defaultValues },
  });

  const { handleSubmit, control } = formMethods;
  const values = useWatch({ control });

  const getMergedMappedColumns = useCallback((data: EpiUploadMappedColumnsFormFields) => {
    const sheetValues = invert(data);

    const mergedMappedColumns = store.getState().mappedColumns.map((mappedColumn) => {
      const formValue = sheetValues[mappedColumn.originalIndex.toString()];
      const isCaseIdColumn = formValue === 'case_id';
      const isCaseDateColumn = formValue === 'case_date';
      let caseTypeCol: CaseTypeCol | null = null;
      if (!isCaseIdColumn && !isCaseDateColumn && !!formValue) {
        caseTypeCol = caseTypeColMap.map.get(formValue) || null;
      }
      return {
        ...mappedColumn,
        isCaseIdColumn,
        isCaseDateColumn,
        caseTypeCol,
      };
    });
    return mergedMappedColumns;
  }, [caseTypeColMap.map, store]);

  const unMappedColumns = useMemo(() => {
    return getMergedMappedColumns(values).filter(mappedColumn => {
      // ignore case type columns
      if (mappedColumn.isCaseTypeColumn) {
        return false;
      }
      // ignore case id column when creating cases
      if (importAction === EPI_UPLOAD_ACTION.CREATE && mappedColumn.isCaseIdColumn) {
        return false;
      }
      return !mappedColumn.isCaseIdColumn && !mappedColumn.isCaseDateColumn && !mappedColumn.caseTypeCol;
    });
  }, [getMergedMappedColumns, importAction, values]);

  const onFormSubmit = useCallback(async (data: EpiUploadMappedColumnsFormFields) => {
    await setMappedColumns(getMergedMappedColumns(data));
    await goToNextStep();
  }, [getMergedMappedColumns, goToNextStep, setMappedColumns]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  const renderField = useCallback((definition: FormFieldDefinition<EpiUploadMappedColumnsFormFields>, element: ReactElement) => {
    const columnIndexInRawData = values[definition.name]; // Note, this is a string, so '0', '1', '2', etc.

    let firstFiveValuesString = t('<not mapped>');
    if (columnIndexInRawData) {
      const columnValues = uniq(rawData.slice(1).map((row) => row[parseInt(columnIndexInRawData, 10)] ?? '')).filter(x => !!x);
      firstFiveValuesString = columnValues.slice(0, 5).join(', ').trim() || t('<no data>');
    }

    return (
      <TableRow key={definition.name}>
        <TableCell>
          {element}
        </TableCell>
        <TableCell>
          {firstFiveValuesString}
        </TableCell>
      </TableRow>
    );
  }, [values, rawData, t]);

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
            zIndex: (theme) => theme.zIndex.tooltip - 1,
          }}
        >
          <TableRow>
            <TableCell sx={{ width: '50%' }}>
              {t`Mapping`}
            </TableCell>
            <TableCell sx={{ width: '50%' }}>
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
          <Alert severity={'info'}>
            <AlertTitle>
              {unMappedColumns.length === 0 ? t('All columns in {{fileName}} have been mapped to known columns in {{applicationName}}', { fileName, applicationName: ConfigManager.instance.config.applicationName }) : t('{{numUnmappedColumns}} columns in {{fileName}} are not mapped', { numUnmappedColumns: unMappedColumns.length, fileName })}
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
                formId={formId}
                formMethods={formMethods}
                renderField={renderField}
                wrapForm={wrapForm}
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
