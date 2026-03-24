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
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { DownloadUtil } from '../../../utils/DownloadUtil';
import { Autocomplete } from '../../form/fields/Autocomplete';
import { StringUtil } from '../../../utils/StringUtil';
import { ConfigManager } from '../../../classes/managers/ConfigManager';

export interface EpiSequenceDownloadDialogOpenProps {
  cases: Case[];
  geneticSequenceColId?: string;
}

export interface EpiSequenceDownloadDialogProps extends WithDialogRenderProps<EpiSequenceDownloadDialogOpenProps> {
  //
}

export type EpiSequenceDownloadDialogRefMethods = WithDialogRefMethods<EpiSequenceDownloadDialogProps, EpiSequenceDownloadDialogOpenProps>;

type FormFields = {
  geneticSequenceColId: string;
};

export const EpiSequenceDownloadDialog = withDialog<EpiSequenceDownloadDialogProps, EpiSequenceDownloadDialogOpenProps>((
  {
    openProps,
    onTitleChange,
    onClose,
  }: EpiSequenceDownloadDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));

  const geneticSequenceColOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const options: AutoCompleteOption<string>[] = [];

    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        if (refCol?.col_type === ColType.GENETIC_SEQUENCE) {
          options.push({
            value: col.id,
            label: col.label,
          });
        }
      });
    });
    return options;
  }, [completeCaseType]);

  const [geneticSequenceColId, setGeneticSequenceColId] = useState(openProps?.geneticSequenceColId ?? geneticSequenceColOptions?.length === 1 ? geneticSequenceColOptions[0].value : '');

  const formMethods = useForm<FormFields>({
    values: {
      geneticSequenceColId,
    },
  });

  const onDownloadFastaButtonClick = useCallback(() => {
    DownloadUtil.downloadAsMultiPartForm({
      action: `${ConfigManager.instance.config.getAPIBaseUrl()}/v1/retrieve/genetic_sequence/fasta`,
      data: {
        case_type_id: completeCaseType.id,
        case_ids: openProps.cases.map(c => c.id),
        genetic_sequence_col_id: geneticSequenceColId,
        file_name: `${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createSlug(geneticSequenceColOptions.find(x => x.value === geneticSequenceColId)?.label)}-sequences.fasta`,
      },
    });
    onClose();
  }, [completeCaseType.id, completeCaseType.name, geneticSequenceColId, geneticSequenceColOptions, onClose, openProps.cases]);

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
              disabled={geneticSequenceColOptions.length < 2}
              label={t`Genetic sequence column`}
              options={geneticSequenceColOptions}
              name={'geneticSequenceColId'}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(value: string) => setGeneticSequenceColId(value)}
            />
          </form>
        </FormProvider>
      </Box>
      {geneticSequenceColId && (
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
