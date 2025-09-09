import {
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

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
} from '../../../models/epiUpload';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';

export type EpiUploadMapColumnsProps = {
  readonly completeCaseType: CompleteCaseType;
  readonly rawData: string[][];
  readonly importAction: EPI_UPLOAD_ACTION;
  readonly onProceed: (mappedColumns: EpiUploadMappedColumn[]) => void;
  readonly onGoBack?: () => void;
  readonly mappedColumns?: EpiUploadMappedColumn[];
};

export const EpiUploadMapColumns = ({ completeCaseType, rawData, onProceed, onGoBack, mappedColumns: mappedColumnsFromProps, importAction }: EpiUploadMapColumnsProps) => {
  const [t] = useTranslation();
  const caseTypeColMap = useCaseTypeColMapQuery();
  const [hasError, setHasError] = useState(false);

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
    return EpiUploadUtil.getSchemaFromMappedColumns(mappedColumns, t);
  }, [mappedColumns, t]);

  const defaultValues: EpiUploadMappedColumnsFormFields = useMemo(() => {
    return EpiUploadUtil.getDefaultColumMappingFormValues(mappedColumns);
  }, [mappedColumns]);

  const caseTypeColOptions = useMemo(() => {
    return EpiUploadUtil.getCaseTypeColOptions(completeCaseType);
  }, [completeCaseType]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<EpiUploadMappedColumnsFormFields>[]>(() => {
    return EpiUploadUtil.getFormFieldDefinitionsFromMappedColumns(mappedColumns, caseTypeColOptions);
  }, [caseTypeColOptions, mappedColumns]);

  const formMethods = useForm<EpiUploadMappedColumnsFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<EpiUploadMappedColumnsFormFields>,
    values: { ...defaultValues },
    defaultValues: { ...defaultValues },
  });

  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback((data: EpiUploadMappedColumnsFormFields) => {
    const mergedMappedColumns = mappedColumns.map((mappedColumn) => {
      const formValue = data[mappedColumn.originalIndex.toString()];
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

    const hasCaseIdColumnMapped = mergedMappedColumns.some(c => c.isCaseIdColumn);
    const hasCaseDateColumnMapped = mergedMappedColumns.some(c => c.isCaseDateColumn);

    if (importAction === EPI_UPLOAD_ACTION.UPDATE && !hasCaseIdColumnMapped) {
      setHasError(true);
      return;
    }
    if (importAction === EPI_UPLOAD_ACTION.CREATE && !hasCaseDateColumnMapped) {
      setHasError(true);
      return;
    }
    onProceed(mergedMappedColumns);
  }, [caseTypeColMap.map, importAction, mappedColumns, onProceed]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (
    <ResponseHandler loadables={loadables}>
      <GenericForm<EpiUploadMappedColumnsFormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      {importAction === EPI_UPLOAD_ACTION.UPDATE && (
        <Alert
          severity={hasError ? 'error' : 'warning'}
          sx={{ mt: 2, mb: 2 }}
        >
          <AlertTitle>
            {t`You're about to update existing cases`}
          </AlertTitle>
          <Typography>
            {t`At least one of the columns should be mapped to the "case_id" column.`}
          </Typography>
          <Typography>
            {t`Any mapping to the "case_date" column will be ignored during the import.`}
          </Typography>
        </Alert>
      )}
      {importAction === EPI_UPLOAD_ACTION.CREATE && (
        <Alert
          severity={hasError ? 'error' : 'warning'}
          sx={{ mt: 2, mb: 2 }}
        >
          <AlertTitle>
            {t`You're about to create new cases`}
          </AlertTitle>
          <Typography>
            {t`At least one of the columns should be mapped to the "case_date" column.`}
          </Typography>
          <Typography>
            {t`Any mapping to the "case_id" column will be ignored during the import.`}
          </Typography>
        </Alert>
      )}
      <Box
        sx={{
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
