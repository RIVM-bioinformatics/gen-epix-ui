import {
  useCallback,
  useId,
  useMemo,
} from 'react';
import {
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
} from '@mui/material';
import { t } from 'i18next';

import type {
  CaseTypeCol,
  CompleteCaseType,
  Dim,
} from '../../../api';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import type {
  AutoCompleteOption,
  FormFieldDefinition,
} from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import type { EpiUploadMappedColumn } from '../../../models/epiUpload';
import { useCaseTypeColMapQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';

type FormFields = {
  [key: string]: string | null;
};

export type EpiUploadMapColumnsProps = {
  readonly completeCaseType: CompleteCaseType;
  readonly rawData: string[][];
  readonly onProceed: (mappedColumns: EpiUploadMappedColumn[]) => void;
  readonly onGoBack?: () => void;
  readonly mappedColumns?: EpiUploadMappedColumn[];
};


export const EpiUploadMapColumns = ({ completeCaseType, rawData, onProceed, onGoBack, mappedColumns: mappedColumnsFromProps }: EpiUploadMapColumnsProps) => {
  const caseTypeColMap = useCaseTypeColMapQuery();

  const loadables = useArray([
    caseTypeColMap,
  ]);

  const formId = useId();
  const mappedColumns = useMemo<EpiUploadMappedColumn[]>(() => {
    if (mappedColumnsFromProps) {
      return mappedColumnsFromProps;
    }
    if (rawData.length === 0) {
      return [];
    }
    return rawData[0].map((label, index) => {
      return {
        originalIndex: index,
        originalLabel: label,
        caseTypeCol: Object.values(completeCaseType.case_type_cols).find(caseTypeCol => {
          if (EpiCaseTypeUtil.matchColumnLabel(label, caseTypeCol)) {
            return true;
          }
        }) || null,
      };
    });
  }, [completeCaseType.case_type_cols, mappedColumnsFromProps, rawData]);

  const schema = useMemo(() => {
    const s = object({});

    if (!mappedColumns.length) {
      return s;
    }
    mappedColumns.forEach((header) => {
      s.concat(object().shape({
        [header.originalIndex.toString()]: string().nullable().uuid4().transform((_val: unknown, orig: string) => orig || null),
      }));
    });
    return s;

  }, [mappedColumns]);

  const defaultValues: FormFields = useMemo(() => {
    const values: FormFields = {};
    mappedColumns.forEach((header) => {
      values[header.originalIndex.toString()] = header.caseTypeCol?.id || null;
    });
    return values;
  }, [mappedColumns]);

  const caseTypeColOptions = useMemo(() => {
    const options: AutoCompleteOption<string>[] = [];
    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dim: Dim, caseTypeColumns: CaseTypeCol[]) => {
      EpiCaseTypeUtil.iterateCaseTypeColumns(completeCaseType, caseTypeColumns, (caseTypeCol) => {
        options.push({
          value: caseTypeCol.id,
          label: `${caseTypeCol.label} (${caseTypeCol.code})`,
        });
      });
    });
    return options;
  }, [completeCaseType]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return mappedColumns.map((header) => ({
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: header.originalIndex.toString(),
      label: header.originalLabel || `Column ${header.originalIndex + 1}`,
      options: caseTypeColOptions,
      multiple: false,
      clearOnBlur: true,
      disabled: false,
      fullWidth: true,
    }));
  }, [caseTypeColOptions, mappedColumns]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    values: { ...defaultValues },
    defaultValues: { ...defaultValues },
  });

  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback((data: FormFields) => {
    const mergedMappedColumns = mappedColumns.map((mappedColumn) => ({
      ...mappedColumn,
      caseTypeCol: data[mappedColumn.originalIndex.toString()] ? caseTypeColMap.map.get(data[mappedColumn.originalIndex.toString()]) : null,
    }));
    onProceed(mergedMappedColumns);
  }, [caseTypeColMap, mappedColumns, onProceed]);

  const onProceedButtonClick = useCallback(async () => {
    await handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);


  return (
    <ResponseHandler loadables={loadables}>
      <Box>
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
      </Box>
    </ResponseHandler>
  );
};
