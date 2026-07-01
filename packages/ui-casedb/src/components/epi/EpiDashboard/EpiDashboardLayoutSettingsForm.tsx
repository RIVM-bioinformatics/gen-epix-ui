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
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { ConfigManager } from '@gen-epix/ui';
import noop from 'lodash/noop';

import { ArrangementEditor } from '../../forms/fields/ArrangementEditor';
import type { CaseDbConfig } from '../../../models/config';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { DashboardUtil } from '../../../utils/DashboardUtil';

export type EpiDashboardLayoutSettingsFormProps = {
  readonly onReset: () => void;
};

type FormValues = {
  arrangementKey: string;
};

export const EpiDashboardLayoutSettingsForm = ({ onReset }: EpiDashboardLayoutSettingsFormProps) => {
  const { t } = useTranslation();
  const userProfileStore = use(UserProfileStoreContext);

  const resetEpiDashboardLayout = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardLayout));
  const epiDashboardArrangementConfig = useStore(userProfileStore, useShallow((state) => state.epiDashboardArrangementConfig));
  const setEpiDashboardLayoutUserConfig = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardArrangementConfig));

  const formMethods = useForm<FormValues>({
    values: {
      arrangementKey: epiDashboardArrangementConfig.arrangementKey,
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
    const { arrangementKey } = formValues;
    if (!arrangementKey) {
      return;
    }
    const arrangementOptions = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS;
    const arrangement = arrangementOptions[arrangementKey];
    if (!arrangement) {
      return;
    }

    setEpiDashboardLayoutUserConfig({
      arrangementKey,
      arrangementWidgetAssignments: DashboardUtil.getArrangementWidgetAssignments(arrangement, ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_WIDGET_ASSIGNMENTS[arrangementKey]),
    });
  }, [formValues, setEpiDashboardLayoutUserConfig]);

  const onSubmit = noop;

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
              name={'arrangementKey'}
              options={ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS}
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
