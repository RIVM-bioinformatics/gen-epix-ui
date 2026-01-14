import {
  Alert,
  AlertTitle,
  Box,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import noop from 'lodash/noop';

import { FileSelector } from '../../ui/FileSelector';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { useSequencingProtocolOptionsQuery } from '../../../dataHooks/useSequencingProtocolsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import type {
  FormFieldDefinition,
  SelectOption,
} from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { useAssemblyProtocolOptionsQuery } from '../../../dataHooks/useAssemblyProtocolsQuery';

import { EpiUploadNavigation } from './EpiUploadNavigation';


type FormFields = {
  sequencingProtocolId: string;
  assemblyProtocolId: string;
  sampleIdCaseTypeColId: string;
};

export const EpiUploadSelectSequenceFiles = () => {
  const [t] = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setSequenceFilesDataTransfer = useStore(store, (state) => state.setSequenceFilesDataTransfer);
  const sampleIdCaseTypeColId = useStore(store, (state) => state.sampleIdCaseTypeColId);
  const initialDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const dataTransfer = useRef(initialDataTransfer);

  const formId = useId();

  const sequencingProtocolOptionsQuery = useSequencingProtocolOptionsQuery();
  const assemblyProtocolOptionsQuery = useAssemblyProtocolOptionsQuery();

  const loadables = useArray([
    sequencingProtocolOptionsQuery,
    assemblyProtocolOptionsQuery,
  ]);

  const sampleIdCaseTypeColIdOptions = useMemo<SelectOption<string>[]>(() => {
    return mappedColumns.filter(mc => mc.isSampleIdColumn).map(mc => ({
      label: mc.caseTypeCol.label,
      value: mc.caseTypeCol.id,
    } satisfies SelectOption<string>));
  }, [mappedColumns]);

  const schema = useMemo(() => object<FormFields>().shape({
    // eslint-disable-next-line react-hooks/refs
    sequencingProtocolId: string().when({
      is: () => Array.from(dataTransfer.current?.files ?? []).filter(f => EpiUploadUtil.isReadsFile(f.name)).length > 0,
      then: () => string().uuid4().required(),
      otherwise: () => string().nullable().notRequired(),
    }),
    // eslint-disable-next-line react-hooks/refs
    assemblyProtocolId: string().when({
      is: () => Array.from(dataTransfer.current?.files ?? []).filter(f => EpiUploadUtil.isGenomeFile(f.name)).length > 0,
      then: () => string().uuid4().required(),
      otherwise: () => string().nullable().notRequired(),
    }),
    // eslint-disable-next-line react-hooks/refs
    sampleIdCaseTypeColId: string().when({
      is: () => Array.from(dataTransfer.current?.files ?? []).length > 0,
      then: () => string().uuid4().required(),
      otherwise: () => string().nullable().notRequired(),
    }),
  }), []);

  const defaultFormValues = useMemo<FormFields>(() => {
    return {
      sequencingProtocolId: store.getState().sequencingProtocolId ?? null,
      assemblyProtocolId: store.getState().assemblyProtocolId ?? null,
      sampleIdCaseTypeColId: store.getState().sampleIdCaseTypeColId ?? null,
    };
  }, [store]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: defaultFormValues,
    values: defaultFormValues,
  });
  const { handleSubmit, setValue } = formMethods;

  useEffect(() => {
    if (sequencingProtocolOptionsQuery.isLoading || assemblyProtocolOptionsQuery.isLoading) {
      return;
    }
    if (!store.getState().sequencingProtocolId) {
      setValue('sequencingProtocolId', sequencingProtocolOptionsQuery.options[0]?.value || null);
      store.setState({ sequencingProtocolId: sequencingProtocolOptionsQuery.options[0]?.value || null });
    }
    if (!store.getState().assemblyProtocolId) {
      setValue('assemblyProtocolId', assemblyProtocolOptionsQuery.options[0]?.value || null);
      store.setState({ assemblyProtocolId: assemblyProtocolOptionsQuery.options[0]?.value || null });
    }
    if (!store.getState().sampleIdCaseTypeColId) {
      setValue('sampleIdCaseTypeColId', sampleIdCaseTypeColIdOptions[0]?.value || null);
      store.setState({ sampleIdCaseTypeColId: sampleIdCaseTypeColIdOptions[0]?.value || null });
    }
  }, [assemblyProtocolOptionsQuery.isLoading, assemblyProtocolOptionsQuery.options, sequencingProtocolOptionsQuery.isLoading, sequencingProtocolOptionsQuery.options, setValue, store, sampleIdCaseTypeColIdOptions]);

  const onSequencingProtocolChange = useCallback((value: string) => {
    store.setState({ sequencingProtocolId: value });
  }, [store]);

  const onAssemblyProtocolChange = useCallback((value: string) => {
    store.setState({ assemblyProtocolId: value });
  }, [store]);

  const onSampleIdCaseTypeColIdChange = useCallback((value: string) => {
    store.setState({ sampleIdCaseTypeColId: value });
  }, [store]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          name: 'assemblyProtocolId',
          label: t`Genome files: assembly protocol`,
          options: assemblyProtocolOptionsQuery.options,
          loading: assemblyProtocolOptionsQuery.isLoading,
          onChange: onAssemblyProtocolChange,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          name: 'sequencingProtocolId',
          label: t`Reads files: sequencing protocol`,
          options: sequencingProtocolOptionsQuery.options,
          loading: sequencingProtocolOptionsQuery.isLoading,
          onChange: onSequencingProtocolChange,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          name: 'sampleIdCaseTypeColId',
          label: t`Sample ID column`,
          options: sampleIdCaseTypeColIdOptions,
          onChange: onSampleIdCaseTypeColIdChange,
        } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [assemblyProtocolOptionsQuery.isLoading, assemblyProtocolOptionsQuery.options, onAssemblyProtocolChange, onSampleIdCaseTypeColIdChange, onSequencingProtocolChange, sampleIdCaseTypeColIdOptions, sequencingProtocolOptionsQuery.isLoading, sequencingProtocolOptionsQuery.options, t]);


  const hasWritableSampleIdColumn = useMemo(() => {
    return mappedColumns.some(mappedColumn => {
      return mappedColumn.isSampleIdColumn && mappedColumn.sampleIdentifierIssuerId;
    });
  }, [mappedColumns]);

  const hasRowContentForSampleIdCaseTypeColId = useMemo(() => {
    if (!sampleIdCaseTypeColId) {
      return false;
    }
    return validatedCases.some(vc => {
      return vc.validated_content[sampleIdCaseTypeColId]?.trim().length > 0;
    });
  }, [sampleIdCaseTypeColId, validatedCases]);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const canUploadSequences = useMemo(() => {
    return completeCaseTypeColumnStats.sequenceColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const canUploadReads = useMemo(() => {
    return completeCaseTypeColumnStats.readsColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const canUpload = useMemo(() => {
    return hasWritableSampleIdColumn && hasRowContentForSampleIdCaseTypeColId && (canUploadSequences || canUploadReads);
  }, [hasWritableSampleIdColumn, hasRowContentForSampleIdCaseTypeColId, canUploadSequences, canUploadReads]);

  const accept = useMemo(() => {
    let acc = '';
    if (canUploadSequences) {
      acc += '.fa,.fasta,.fa.gz,.fasta.gz,';
    }
    if (canUploadReads) {
      acc += '.fq,.fastq,.fq.gz,.fastq.gz,';
    }
    return acc;
  }, [canUploadReads, canUploadSequences]);

  const onProceedButtonClick = useCallback(async () => {
    setSequenceFilesDataTransfer(canUpload ? dataTransfer.current : new DataTransfer());
    await handleSubmit(async () => {
      await goToNextStep();
    })();
  }, [canUpload, goToNextStep, handleSubmit, setSequenceFilesDataTransfer]);

  const onDataTransferChange = useCallback((dt: DataTransfer) => {
    dataTransfer.current = dt;

    // Note: setState in a timeout to avoid React state update during rendering warning
    setTimeout(() => {
      setSequenceFilesDataTransfer(dataTransfer.current);
    });
  }, [setSequenceFilesDataTransfer]);

  const wrapForm = useCallback((children: ReactElement) => {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: theme.spacing(1),
          gridTemplateColumns: '1fr 1fr 1fr',
        }}
      >
        {children}
      </Box>
    );
  }, [theme]);

  const cantUploadMessage = useMemo<{ title: string; message: string }>(() => {
    if (!hasWritableSampleIdColumn) {
      return {
        title: t('Uploading of files is disabled.'),
        message: t`No columns have been mapped as writable sample ID column with selected identifier issuer provider.`,
      };
    }
    if (!hasRowContentForSampleIdCaseTypeColId) {
      return {
        title: t('Uploading of files is disabled.'),
        message: t`No rows have a sample ID filled for the selected sample ID column.`,
      };
    }
    if (!canUploadReads) {
      return {
        title: t('Uploading of read files is disabled.'),
        message: t`The selected case type does not support uploading read files.`,
      };
    }
    if (!canUploadSequences) {
      return {
        title: t('Uploading of sequence files is disabled.'),
        message: t`The selected case type does not support uploading sequence files.`,
      };
    }
    return null;
  }, [canUploadReads, canUploadSequences, hasRowContentForSampleIdCaseTypeColId, hasWritableSampleIdColumn, t]);

  return (
    <ResponseHandler
      loadables={loadables}
    >
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: `${canUpload ? '' : 'max-content '}max-content auto max-content`,
          position: 'relative',
        }}
      >
        {!canUpload && (
          <Box marginBottom={2}>
            <Alert severity={'error'}>
              <AlertTitle>
                {cantUploadMessage.title}
              </AlertTitle>
              {cantUploadMessage.message}
            </Alert>
          </Box>
        )}
        <Box
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            maxWidth={theme.spacing(128)}
          >
            <GenericForm<FormFields>
              formFieldDefinitions={formFieldDefinitions}
              formId={formId}
              formMethods={formMethods}
              wrapForm={wrapForm}
              schema={schema}
              onSubmit={noop}
            />
          </Box>
          {!canUploadSequences && (
            <Box marginY={1}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('Uploading of sequences has been disabled.')}
                </AlertTitle>
                <Box>
                  {t('Uploading of sequences is not supported for the selected case type.')}
                </Box>
              </Alert>
            </Box>
          )}
          {!canUploadReads && (
            <Box marginY={1}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('Uploading of read files has been disabled.')}
                </AlertTitle>
                <Box>
                  {t('Uploading of read files is not supported for the selected case type.')}
                </Box>
              </Alert>
            </Box>
          )}
        </Box>
        <Box
          sx={{
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
              height: '100%',
            }}
          >
            {canUpload && (
              <FileSelector
                initialDataTransfer={initialDataTransfer}
                accept={accept}
                numFilesAllowed={Infinity}
                onDataTransferChange={onDataTransferChange}
              />
            )}
          </Box>
        </Box>
        <EpiUploadNavigation
          proceedLabel={!canUpload ? t`Proceed` : undefined}
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onProceedButtonClick}
        />
      </Box>
    </ResponseHandler>
  );
};
