import {
  Box,
  Button,
  FormGroup,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  FormProvider,
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { ConfigManager } from '@gen-epix/ui';

import type { EpiDashboardArrangementConfig } from '../../../models/epi';
import { ArrangementEditor } from '../../forms/fields/ArrangementEditor';
import type { CaseDbConfig } from '../../../models/config';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

export type EpiDashboardLayoutSettingsFormProps = {
  readonly onReset: () => void;
};

type FormValues = Pick<EpiDashboardArrangementConfig, 'arrangement'>;

export const EpiDashboardLayoutSettingsForm = ({ onReset }: EpiDashboardLayoutSettingsFormProps) => {
  const { t } = useTranslation();
  const userProfileStore = use(UserProfileStoreContext);

  const resetEpiDashboardLayout = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardLayout));
  const epiDashboardArrangementConfig = useStore(userProfileStore, useShallow((state) => state.epiDashboardArrangementConfig));
  const setEpiDashboardLayoutUserConfig = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardArrangementConfig));

  const formMethods = useForm<FormValues>({
    values: {
      arrangement: epiDashboardArrangementConfig.arrangement,
    },
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetEpiDashboardLayout();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetEpiDashboardLayout]);

  useEffect(() => {
    const arrangement = formValues.arrangement;

    setEpiDashboardLayoutUserConfig({
      arrangement,
      arrangementWidgetAssignments: DashboardUtil.getArrangementWidgetAssignments(arrangement, epiDashboardArrangementConfig.arrangementWidgetAssignments),
    });
  }, [epiDashboardArrangementConfig.arrangementWidgetAssignments, formValues, setEpiDashboardLayoutUserConfig]);

  const onSubmit = useCallback(() => {
    // No submit action needed since changes are applied immediately
  }, []);

  const arrangementEditorOptions = useMemo(() => Object.values(ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS), []);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        onSubmit={onSubmit}
      >
        <Box
          sx={{
            marginY: 1,
          }}
        >
          <FormGroup>
            <ArrangementEditor
              label={t`Arrangement`}
              name={'arrangement'}
              options={arrangementEditorOptions}
            />
          </FormGroup>
        </Box>
      </form>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Box
          sx={{
            marginX: 1,
          }}
        >
          <Button
            color={'primary'}
            onClick={onResetButtonClick}
            startIcon={<RestartAltIcon />}
            variant={'outlined'}
          >
            {t`Reset dashboard layout`}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
