import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import noop from 'lodash/noop';

import type { Case } from '../../../api';
import { ColType } from '../../../api';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import type { AutoCompleteOption } from '../../../models/form';
import { EpiStoreContext } from '../../../stores/epiStore';
import { EpiDownloadUtil } from '../../../utils/EpiDownloadUtil';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { Autocomplete } from '../../form/fields/Autocomplete';
import { StringUtil } from '../../../utils/StringUtil';
import { ConfigManager } from '../../../classes/managers/ConfigManager';

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

  const onDownloadFastaButtonClick = useCallback(() => {
    EpiDownloadUtil.downloadAsMultiPartForm({
      action: `${ConfigManager.instance.config.getAPIBaseUrl()}/v1/retrieve/genetic_sequence/fasta`,
      data: {
        case_ids: openProps.cases.map(c => c.id),
        genetic_sequence_case_type_col_id: geneticSequenceCaseTypeColId,
        file_name: `${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createSlug(geneticSequenceCaseTypeColOptions.find(x => x.value === geneticSequenceCaseTypeColId)?.label)}-sequences.fasta`,
      },
    });
    onClose();
  }, [completeCaseType.name, geneticSequenceCaseTypeColId, geneticSequenceCaseTypeColOptions, onClose, openProps.cases]);

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
              options={geneticSequenceCaseTypeColOptions}
              name={'geneticSequenceCaseTypeColId'}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(value: string) => setGeneticSequenceCaseTypeColId(value)}
            />
          </form>
        </FormProvider>
      </Box>
      {geneticSequenceCaseTypeColId && (
        <Box
          marginBottom={1}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <Box>
            <Button
              startIcon={<DownloadIcon />}
              color={'primary'}
              onClick={onDownloadFastaButtonClick}
            >
              {t`Download FASTA`}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}, {
  testId: 'EpiSequenceDownloadDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
