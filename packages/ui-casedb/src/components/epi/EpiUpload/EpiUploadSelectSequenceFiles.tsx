import {
  Alert,
  AlertTitle,
  Box,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  use,
  useCallback,
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
import type {
  FormFieldDefinition,
  SelectOption,
} from '@gen-epix/ui';
import {
  FORM_FIELD_DEFINITION_TYPE,
  GenericForm,
  ResponseHandler,
  useArray,
} from '@gen-epix/ui';

import { FileSelector } from '../../ui/FileSelector';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { useSequencingProtocolOptionsQuery } from '../../../dataHooks/useSequencingProtocolsQuery';
import { useAssemblyProtocolOptionsQuery } from '../../../dataHooks/useAssemblyProtocolsQuery';

import { EpiUploadNavigation } from './EpiUploadNavigation';


type FormFields = {
  assemblyProtocolId: string;
  sampleIdColId: string;
  sequencingProtocolId: string;
};

export const EpiUploadSelectSequenceFiles = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const store = use(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setSequenceFilesDataTransfer = useStore(store, (state) => state.setSequenceFilesDataTransfer);
  const sampleIdColId = useStore(store, (state) => state.sampleIdColId);
  const initialDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const dataTransferRef = useRef(initialDataTransfer);

  const formId = useId();

  const sequencingProtocolOptionsQuery = useSequencingProtocolOptionsQuery();
  const assemblyProtocolOptionsQuery = useAssemblyProtocolOptionsQuery();

  const loadables = useArray([
    sequencingProtocolOptionsQuery,
    assemblyProtocolOptionsQuery,
  ]);

  const sampleIdColIdOptions = useMemo<SelectOption<string>[]>(() => {
    return mappedColumns.filter(mc => mc.isSampleIdColumn).map(mc => ({
      label: mc.col.label,
      value: mc.col.id,
    } satisfies SelectOption<string>));
  }, [mappedColumns]);

  const schema = useMemo(() => object<FormFields>().shape({
    assemblyProtocolId: string().when({
      is: () => Array.from(dataTransferRef.current?.files ?? []).filter(f => EpiUploadUtil.isGenomeFile(f.name)).length > 0,
      otherwise: () => string().nullable().notRequired(),
      then: () => string().uuid4().required(),
    }),
    sampleIdColId: string().when({
      is: () => Array.from(dataTransferRef.current?.files ?? []).length > 0,
      otherwise: () => string().nullable().notRequired(),
      then: () => string().uuid4().required(),
    }),
    sequencingProtocolId: string().when({
      is: () => Array.from(dataTransferRef.current?.files ?? []).filter(f => EpiUploadUtil.isReadsFile(f.name)).length > 0,
      otherwise: () => string().nullable().notRequired(),
      then: () => string().uuid4().required(),
    }),
  }), []);

  const defaultFormValues = useMemo<FormFields>(() => {
    return {
      assemblyProtocolId: store.getState().assemblyProtocolId ?? null,
      sampleIdColId: store.getState().sampleIdColId ?? null,
      sequencingProtocolId: store.getState().sequencingProtocolId ?? null,
    };
  }, [store]);

  const formMethods = useForm<FormFields>({
    defaultValues: defaultFormValues,
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
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
    if (!store.getState().sampleIdColId) {
      setValue('sampleIdColId', sampleIdColIdOptions[0]?.value || null);
      store.setState({ sampleIdColId: sampleIdColIdOptions[0]?.value || null });
    }
  }, [assemblyProtocolOptionsQuery.isLoading, assemblyProtocolOptionsQuery.options, sequencingProtocolOptionsQuery.isLoading, sequencingProtocolOptionsQuery.options, setValue, store, sampleIdColIdOptions]);

  const onSequencingProtocolChange = useCallback((value: string) => {
    store.setState({ sequencingProtocolId: value });
  }, [store]);

  const onAssemblyProtocolChange = useCallback((value: string) => {
    store.setState({ assemblyProtocolId: value });
  }, [store]);

  const onSampleIdColIdChange = useCallback((value: string) => {
    store.setState({ sampleIdColId: value });
  }, [store]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          label: t`Genome files: assembly protocol`,
          loading: assemblyProtocolOptionsQuery.isLoading,
          name: 'assemblyProtocolId',
          onChange: onAssemblyProtocolChange,
          options: assemblyProtocolOptionsQuery.options,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          label: t`Reads files: sequencing protocol`,
          loading: sequencingProtocolOptionsQuery.isLoading,
          name: 'sequencingProtocolId',
          onChange: onSequencingProtocolChange,
          options: sequencingProtocolOptionsQuery.options,
        } as const satisfies FormFieldDefinition<FormFields>,
        {
          definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
          label: t`Sample ID column`,
          name: 'sampleIdColId',
          onChange: onSampleIdColIdChange,
          options: sampleIdColIdOptions,
        } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [assemblyProtocolOptionsQuery.isLoading, assemblyProtocolOptionsQuery.options, onAssemblyProtocolChange, onSampleIdColIdChange, onSequencingProtocolChange, sampleIdColIdOptions, sequencingProtocolOptionsQuery.isLoading, sequencingProtocolOptionsQuery.options, t]);


  const hasWritableSampleIdColumn = useMemo(() => {
    return mappedColumns.some(mappedColumn => {
      return mappedColumn.isSampleIdColumn && mappedColumn.sampleIdentifierIssuerId;
    });
  }, [mappedColumns]);

  const hasRowContentForSampleIdColId = useMemo(() => {
    if (!sampleIdColId) {
      return false;
    }
    return validatedCases.some(vc => {
      return vc.validated_content[sampleIdColId]?.trim().length > 0;
    });
  }, [sampleIdColId, validatedCases]);

  const completeCaseTypeColStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColStats(completeCaseType);
  }, [completeCaseType]);

  const canUploadSequences = useMemo(() => {
    return completeCaseTypeColStats.sequenceColumns.length > 0;
  }, [completeCaseTypeColStats]);

  const canUploadReads = useMemo(() => {
    return completeCaseTypeColStats.readsColumns.length > 0;
  }, [completeCaseTypeColStats]);

  const canUpload = useMemo(() => {
    return hasWritableSampleIdColumn && hasRowContentForSampleIdColId && (canUploadSequences || canUploadReads);
  }, [hasWritableSampleIdColumn, hasRowContentForSampleIdColId, canUploadSequences, canUploadReads]);

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
    setSequenceFilesDataTransfer(canUpload ? dataTransferRef.current : new DataTransfer());
    await handleSubmit(async () => {
      await goToNextStep();
    })();
  }, [canUpload, goToNextStep, handleSubmit, setSequenceFilesDataTransfer]);

  const onGoBackButtonClick = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

  const onDataTransferChange = useCallback((dt: DataTransfer) => {
    dataTransferRef.current = dt;

    // Note: setState in a timeout to avoid React state update during rendering warning
    setTimeout(() => {
      setSequenceFilesDataTransfer(dataTransferRef.current);
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

  const cantUploadMessage = useMemo<{ message: string; title: string }>(() => {
    if (!hasWritableSampleIdColumn) {
      return {
        message: t`No columns have been mapped as writable sample ID column with selected identifier issuer provider.`,
        title: t('Uploading of files is disabled.'),
      };
    }
    if (!hasRowContentForSampleIdColId) {
      return {
        message: t`No rows have a sample ID filled for the selected sample ID column.`,
        title: t('Uploading of files is disabled.'),
      };
    }
    if (!canUploadReads) {
      return {
        message: t`The selected case type does not support uploading read files.`,
        title: t('Uploading of read files is disabled.'),
      };
    }
    if (!canUploadSequences) {
      return {
        message: t`The selected case type does not support uploading sequence files.`,
        title: t('Uploading of sequence files is disabled.'),
      };
    }
    return null;
  }, [canUploadReads, canUploadSequences, hasRowContentForSampleIdColId, hasWritableSampleIdColumn, t]);

  const onSubmit = useCallback(() => {
    // noop, as we handle form submission manually in onProceedButtonClick
  }, []);

  return (
    <ResponseHandler
      loadables={loadables}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: `${canUpload ? '' : 'max-content '}max-content auto max-content`,
          height: '100%',
          position: 'relative',
        }}
      >
        {!canUpload && (
          <Box
            sx={{
              marginBottom: 2,
            }}
          >
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
            sx={{
              maxWidth: theme.spacing(128),
            }}
          >
            <GenericForm<FormFields>
              formFieldDefinitions={formFieldDefinitions}
              formId={formId}
              formMethods={formMethods}
              onSubmit={onSubmit}
              schema={schema}
              wrapForm={wrapForm}
            />
          </Box>
          {!canUploadSequences && (
            <Box
              sx={{
                marginY: 1,
              }}
            >
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
            <Box
              sx={{
                marginY: 1,
              }}
            >
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
              bottom: 0,
              height: '100%',
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            {canUpload && (
              <FileSelector
                accept={accept}
                initialDataTransfer={initialDataTransfer}
                numFilesAllowed={Infinity}
                onDataTransferChange={onDataTransferChange}
              />
            )}
          </Box>
        </Box>
        <EpiUploadNavigation
          onGoBackButtonClick={onGoBackButtonClick}
          onProceedButtonClick={onProceedButtonClick}
          proceedLabel={!canUpload ? t`Proceed` : undefined}
        />
      </Box>
    </ResponseHandler>
  );
};
