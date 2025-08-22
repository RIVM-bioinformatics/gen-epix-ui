import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ReactElement } from 'react';
import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import noop from 'lodash/noop';

import type { Case } from '../../../api';
import {
  ColType,
  CaseApi,
} from '../../../api';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import type { AutoCompleteOption } from '../../../models/form';
import { EpiStoreContext } from '../../../stores/epiStore';
import { EpiDownloadUtil } from '../../../utils/EpiDownloadUtil';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { SequenceUtil } from '../../../utils/SequenceUtil';
import { CopyToClipboardButton } from '../../ui/CopyToClipboardButton';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { Autocomplete } from '../../form/fields/Autocomplete';

export interface EpiSequenceDownloadDialogOpenProps {
  cases: Case[];
  geneticSequenceCaseTypeColId?: string;
}

export interface EpiSequenceDownloadDialogProps extends WithDialogRenderProps<EpiSequenceDownloadDialogOpenProps> {
  //
}

export type EpiSequenceDownloadDialogRefMethods = WithDialogRefMethods<EpiSequenceDownloadDialogProps, EpiSequenceDownloadDialogOpenProps>;

type FormValues = {
  geneticSequenceCaseTypeColId: string;
};

export const EpiSequenceDownloadDialog = withDialog<EpiSequenceDownloadDialogProps, EpiSequenceDownloadDialogOpenProps>((
  {
    openProps,
    onTitleChange,
    onClose,
  }: EpiSequenceDownloadDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));

  const geneticSequenceCaseTypeColOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const options: AutoCompleteOption<string>[] = [];
    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dimension, dimensionCaseTypeColumns) => {
      dimensionCaseTypeColumns.forEach((caseTypeColumn) => {
        const col = completeCaseType.cols[caseTypeColumn.col_id];
        if (col?.col_type === ColType.GENETIC_SEQUENCE) {
          options.push({
            value: caseTypeColumn.id,
            label: caseTypeColumn.label,
          });
        }
      });
    });
    return options;
  }, [completeCaseType]);

  const [geneticSequenceCaseTypeColId, setGeneticSequenceCaseTypeColId] = useState(openProps?.geneticSequenceCaseTypeColId ?? geneticSequenceCaseTypeColOptions?.length === 1 ? geneticSequenceCaseTypeColOptions[0].value : '');

  const formMethods = useForm<FormValues>({
    values: {
      geneticSequenceCaseTypeColId,
    },
  });

  const queryKey = useMemo(() => {
    return ['retrieveGeneticSequence', geneticSequenceCaseTypeColId, openProps.cases.map(c => c.id)];
  }, [openProps.cases, geneticSequenceCaseTypeColId]);

  const { isLoading, error, data: sequenceResponses } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveGeneticSequence({
        case_ids: openProps.cases.map(c => c.id),
        genetic_sequence_case_type_col_id: geneticSequenceCaseTypeColId,
      }, { signal });
      return response.data;
    },
    enabled: openProps.cases.length > 0 && !!geneticSequenceCaseTypeColId,
  });

  useEffect(() => {
    onTitleChange(t`Download sequences`);
  }, [onTitleChange, t]);

  return (
    <Box>
      <Box marginBottom={3}>
        <FormProvider {...formMethods}>
          <form
            autoComplete={'off'}
            onSubmit={noop}
          >
            <Autocomplete
              disabled={geneticSequenceCaseTypeColOptions.length < 2}
              label={t`Genetic sequence column`}
              name={'geneticSequenceCaseTypeColId'}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(value: string) => setGeneticSequenceCaseTypeColId(value)}
              options={geneticSequenceCaseTypeColOptions}
            />
          </form>
        </FormProvider>
      </Box>


      {geneticSequenceCaseTypeColId && (
        <ResponseHandler
          error={error}
          isLoading={isLoading}
          shouldHideActionButtons
        >
          <Box
            marginBottom={1}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            {sequenceResponses?.length === 1 && (
              <Box>
                <CopyToClipboardButton
                  buttonText={t`Copy sequence to clipboard`}
                  // eslint-disable-next-line react/jsx-no-bind
                  onGetClipboardValue={() => sequenceResponses[0].nucleotide_sequence}
                />
              </Box>
            )}
            <Box>
              <CopyToClipboardButton
                buttonText={t`Copy Fasta to clipboard`}
                // eslint-disable-next-line react/jsx-no-bind
                onGetClipboardValue={() => SequenceUtil.createFastaContent(sequenceResponses, openProps.cases)}
              />
            </Box>
            <Box>
              <Button
                color={'primary'}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => {
                  const fasta = SequenceUtil.createFastaContent(sequenceResponses, openProps.cases);
                  EpiDownloadUtil.createDownloadUrl(`data:text/plain;base64,${btoa(fasta)}`, 'sequences.fasta');
                  onClose();
                }}
                startIcon={<DownloadIcon />}
              >
                {t`Download FASTA`}
              </Button>
            </Box>
          </Box>
        </ResponseHandler>
      )}
    </Box>
  );
}, {
  testId: 'EpiSequenceDownloadDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
