import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useMemo,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';

import type {
  CaseTypeCol,
  CompleteCaseType,
} from '../../../api';
import type { FormFieldDefinition } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { useCaseTypeColMapQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import type {
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
  EPI_UPLOAD_ACTION,
} from '../../../models/epiUpload';

export type EpiUploadMapColumnsProps = {
  readonly completeCaseType: CompleteCaseType;
  readonly rawData: string[][];
  readonly importAction: EPI_UPLOAD_ACTION;
  readonly onProceed: (mappedColumns: EpiUploadMappedColumn[]) => void;
  readonly onGoBack?: () => void;
  readonly mappedColumns?: EpiUploadMappedColumn[];
  readonly fileName: string;
};

export const EpiUploadMapColumns = ({ completeCaseType, rawData, onProceed, onGoBack, mappedColumns: mappedColumnsFromProps, importAction, fileName }: EpiUploadMapColumnsProps) => {
  const [t] = useTranslation();
  const caseTypeColMap = useCaseTypeColMapQuery();

  const loadables = useArray([
    caseTypeColMap,
  ]);

  const formId = useId();
  const mappedColumns = useMemo<EpiUploadMappedColumn[]>(() => {
    if (mappedColumnsFromProps) {
      return mappedColumnsFromProps;
    }
    return EpiUploadUtil.getInitialMappedColumns(completeCaseType, rawData);
  }, [completeCaseType, mappedColumnsFromProps, rawData]);

  const schema = useMemo(() => {
    return EpiUploadUtil.getSchema(completeCaseType, t, importAction);
  }, [completeCaseType, importAction, t]);

  const defaultValues: EpiUploadMappedColumnsFormFields = useMemo(() => {
    return EpiUploadUtil.getDefaultFormValues(completeCaseType, mappedColumns, importAction);
  }, [completeCaseType, mappedColumns, importAction]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadMappedColumnsFormFields>[]>(() => {
    return EpiUploadUtil.getFormFieldDefinitions(completeCaseType, rawData[0], importAction);
  }, [completeCaseType, rawData, importAction]);

  const formMethods = useForm<EpiUploadMappedColumnsFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadMappedColumnsFormFields>,
    values: { ...defaultValues },
    defaultValues: { ...defaultValues },
  });

  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback((data: EpiUploadMappedColumnsFormFields) => {
    const sheetValues = invert(data);

    const mergedMappedColumns = mappedColumns.map((mappedColumn) => {
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

    onProceed(mergedMappedColumns);
  }, [caseTypeColMap.map, mappedColumns, onProceed]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  const renderField = useCallback((definition: FormFieldDefinition<EpiUploadMappedColumnsFormFields>, element: ReactElement) => {
    return (
      <TableRow key={definition.name}>
        <TableCell>
          {definition.label}
        </TableCell>
        <TableCell>
          {element}
        </TableCell>
      </TableRow>
    );
  }, []);

  const wrapForm = useCallback((children: ReactElement) => {
    return (
      <Table
        size={'small'}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '34%' }}>
              {t('Case type column')}
            </TableCell>
            <TableCell sx={{ width: '66%' }}>
              {fileName}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {children}
        </TableBody>
      </Table>
    );
  }, [fileName, t]);

  return (
    <ResponseHandler loadables={loadables}>
      <GenericForm<EpiUploadMappedColumnsFormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        renderField={renderField}
        wrapForm={wrapForm}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      <Box
        sx={{
          marginTop: 2,
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant={'outlined'}
          onClick={onGoBack}
        >
          {t('Go back')}
        </Button>
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
