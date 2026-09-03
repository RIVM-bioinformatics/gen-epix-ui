import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ReactElement } from 'react';
import {
  use,
  useCallback,
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
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';
import { AuthenticationService } from '@gen-epix/ui/classes/services/AuthenticationService';
import { ConfigService } from '@gen-epix/ui/classes/services/ConfigService';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import { DownloadUtil } from '@gen-epix/ui-core/utils/DownloadUtil';
import { Autocomplete } from '@gen-epix/ui-core-form/components/fields/Autocomplete';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form';

import { DashboardStoreContext } from '../../../stores/dashboardStore';


export interface SequenceDownloadDialogOpenProps {
  cases: CaseDbCase[];
  geneticSequenceColId?: string;
}

export interface SequenceDownloadDialogProps extends WithDialogRenderProps<SequenceDownloadDialogOpenProps> {
  //
}

export type SequenceDownloadDialogRefMethods = WithDialogRefMethods<SequenceDownloadDialogProps, SequenceDownloadDialogOpenProps>;

type FormFields = {
  geneticSequenceColId: string;
};

export const SequenceDownloadDialog = withDialog<SequenceDownloadDialogProps, SequenceDownloadDialogOpenProps>((
  {
    onClose,
    onTitleChange,
    openProps,
  }: SequenceDownloadDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, useShallow((state) => state.completeCaseType));

  const geneticSequenceColOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const options: AutoCompleteOption<string>[] = [];

    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        if (refCol?.col_type === CaseDbColType.GENETIC_SEQUENCE) {
          options.push({
            label: col.label,
            value: col.id,
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

  const onSubmit = useCallback(() => {
    // noop, as the download is triggered by a button outside of the form
  }, []);

  const onDownloadFastaButtonClick = useCallback(() => {
    DownloadUtil.downloadAsMultiPartForm({
      accessToken: AuthenticationService.getInstance().authContextProps?.user?.access_token ?? '',
      action: `${ConfigService.getInstance().config.getAPIBaseUrl()}/v1/retrieve/genetic_sequence/fasta`,
      data: {
        case_ids: openProps.cases.map(c => c.id),
        case_type_id: completeCaseType.id,
        file_name: `${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createSlug(geneticSequenceColOptions.find(x => x.value === geneticSequenceColId)?.label)}-sequences.fasta`,
        genetic_sequence_col_id: geneticSequenceColId,
      },
    });
    onClose();
  }, [completeCaseType.id, completeCaseType.name, geneticSequenceColId, geneticSequenceColOptions, onClose, openProps.cases]);

  useEffect(() => {
    onTitleChange(t`Download sequences`);
  }, [onTitleChange, t]);

  return (
    <Box>
      <Box
        sx={{
          marginBottom: 3,
        }}
      >
        <FormProvider {...formMethods}>
          <form
            autoComplete={'off'}
            onSubmit={onSubmit}
          >
            <Autocomplete
              disabled={geneticSequenceColOptions.length < 2}
              label={t`Genetic sequence column`}
              name={'geneticSequenceColId'}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onChange={(value: string) => setGeneticSequenceColId(value)}
              options={geneticSequenceColOptions}
            />
          </form>
        </FormProvider>
      </Box>
      {geneticSequenceColId && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
            marginBottom: 1,
          }}
        >
          <Box>
            <Button
              color={'primary'}
              onClick={onDownloadFastaButtonClick}
              startIcon={<DownloadIcon />}
            >
              {t`Download FASTA`}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'SequenceDownloadDialog',
});
