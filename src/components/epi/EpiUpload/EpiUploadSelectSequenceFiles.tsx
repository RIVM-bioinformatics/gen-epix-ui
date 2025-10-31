import {
  Alert,
  AlertTitle,
  Box,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useContext,
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
import { useLibraryPrepProtocolsOptionsQuery } from '../../../dataHooks/useLibraryPrepProtocolsQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';

import { EpiUploadNavigation } from './EpiUploadNavigation';


type FormFields = {
  libraryPrepProtocolId: string;
};

export const EpiUploadSelectSequenceFiles = () => {
  const [t] = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const setSequenceFilesDataTransfer = useStore(store, (state) => state.setSequenceFilesDataTransfer);
  const initialDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const dataTransfer = useRef(initialDataTransfer);

  const formId = useId();

  const libraryPrepProtocolsQuery = useLibraryPrepProtocolsOptionsQuery();

  const loadables = useArray([
    libraryPrepProtocolsQuery,
  ]);

  const schema = useMemo(() => object<FormFields>().shape({
    libraryPrepProtocolId: string().when({
      is: () => Array.from(dataTransfer.current?.files ?? []).filter(f => EpiUploadUtil.isGenomeFile(f.name)).length > 0,
      then: () => string().uuid4().required(),
      otherwise: () => string().nullable().notRequired(),
    }),
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    defaultValues: {
      libraryPrepProtocolId: null,
    },
    values: {
      libraryPrepProtocolId: store.getState().libraryPrepProtocolId ?? null,
    },
  });
  const { handleSubmit } = formMethods;

  const onLibraryPrepProtocolChange = useCallback((value: string) => {
    store.setState({ libraryPrepProtocolId: value });
  }, [store]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'libraryPrepProtocolId',
          label: t`Library Prep Protocol`,
          options: libraryPrepProtocolsQuery.options,
          loading: libraryPrepProtocolsQuery.isLoading,
          onChange: onLibraryPrepProtocolChange,
          required: false,
        } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [libraryPrepProtocolsQuery.isLoading, libraryPrepProtocolsQuery.options, onLibraryPrepProtocolChange, t]);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const caseTypeSupportsUploadingSequences = useMemo(() => {
    return completeCaseTypeColumnStats.sequenceColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const caseTypeSupportsUploadingReads = useMemo(() => {
    return completeCaseTypeColumnStats.readsColumns.length > 0;
  }, [completeCaseTypeColumnStats]);

  const importDataSupportsUploadingSequences = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.sequenceColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const importDataSupportsUploadingReads = useMemo(() => {
    return mappedColumns?.some(mappedColumn => mappedColumn.caseTypeCol?.id && completeCaseTypeColumnStats.readsColumns.map(c => c.id).includes(mappedColumn.caseTypeCol.id));
  }, [completeCaseTypeColumnStats, mappedColumns]);

  const canUploadSequences = caseTypeSupportsUploadingSequences && importDataSupportsUploadingSequences;
  const canUploadReads = caseTypeSupportsUploadingReads && importDataSupportsUploadingReads;

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

  const canUpload = useMemo(() => {
    return (canUploadSequences) || (canUploadReads);
  }, [canUploadSequences, canUploadReads]);

  const onProceedButtonClick = useCallback(async () => {
    setSequenceFilesDataTransfer(dataTransfer.current);
    await handleSubmit(async () => {
      await goToNextStep();
    })();
  }, [goToNextStep, handleSubmit, setSequenceFilesDataTransfer]);

  const onDataTransferChange = useCallback((dt: DataTransfer) => {
    dataTransfer.current = dt;

    // Note: setState in a timeout to avoid React state update during rendering warning
    setTimeout(() => {
      setSequenceFilesDataTransfer(dataTransfer.current);
    });
  }, [setSequenceFilesDataTransfer]);

  return (
    <ResponseHandler
      loadables={loadables}
    >
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'max-content auto max-content',
          position: 'relative',
        }}
      >
        {!canUpload && (
          <>
            <Alert severity={'info'}>
              <AlertTitle>
                {t('Uploading of sequences or read files is not supported.')}
              </AlertTitle>
              {t`The selected case type does not support uploading sequences or read files, or the imported data does not contain any mapped columns that support uploading of sequences or read files.`}
            </Alert>
            <Box />
          </>
        )}
        {canUpload && (
          <>
            <Box
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {canUploadSequences && (
                <Box
                  marginY={1}
                  maxWidth={theme.spacing(32)}
                >
                  <GenericForm<FormFields>
                    formFieldDefinitions={formFieldDefinitions}
                    formId={formId}
                    formMethods={formMethods}
                    onSubmit={noop}
                  />
                </Box>
              )}
              {!canUploadSequences && (
                <Box marginY={1}>
                  <Alert severity={'info'}>
                    <AlertTitle>
                      {t('Uploading of sequences has been disabled.')}
                    </AlertTitle>
                    {!caseTypeSupportsUploadingSequences && (
                      <Box>
                        {t('Uploading of sequences is not supported for the selected case type.')}
                      </Box>
                    )}
                    {!importDataSupportsUploadingSequences && (
                      <Box>
                        {t('Uploading of sequences is not supported for the imported data.')}
                      </Box>
                    )}
                  </Alert>
                </Box>
              )}
              {!canUploadReads && (
                <Box marginY={1}>
                  <Alert severity={'info'}>
                    <AlertTitle>
                      {t('Uploading of read files has been disabled.')}
                    </AlertTitle>
                    {!caseTypeSupportsUploadingReads && (
                      <Box>
                        {t('Uploading of read files is not supported for the selected case type.')}
                      </Box>
                    )}
                    {!importDataSupportsUploadingReads && (
                      <Box>
                        {t('Uploading of read files is not supported for the imported data.')}
                      </Box>
                    )}
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
                <FileSelector
                  initialDataTransfer={initialDataTransfer}
                  accept={accept}
                  numFilesAllowed={Infinity}
                  onDataTransferChange={onDataTransferChange}
                />
              </Box>
            </Box>
          </>
        )}
        <EpiUploadNavigation
          proceedLabel={!canUpload ? t`Proceed` : undefined}
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onProceedButtonClick}
        />
      </Box>
    </ResponseHandler>
  );
};
