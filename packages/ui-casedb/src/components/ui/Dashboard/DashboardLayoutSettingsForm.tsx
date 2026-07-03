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
import { ConfigService } from '@gen-epix/ui';
import noop from 'lodash/noop';

import { ArrangementEditor } from '../../forms/fields/ArrangementEditor';
import type { CaseDbConfig } from '../../../models/config';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { DashboardUtil } from '../../../utils/DashboardUtil';

export type DashboardLayoutSettingsFormProps = {
  readonly onReset: () => void;
};

type FormValues = {
  arrangementKey: string;
};

export const DashboardLayoutSettingsForm = ({ onReset }: DashboardLayoutSettingsFormProps) => {
  const { t } = useTranslation();
  const userProfileStore = use(UserProfileStoreContext);

  const resetDashboardLayout = useStore(userProfileStore, useShallow((state) => state.resetDashboardLayout));
  const dashboardArrangementConfig = useStore(userProfileStore, useShallow((state) => state.dashboardArrangementConfig));
  const setDashboardLayoutUserConfig = useStore(userProfileStore, useShallow((state) => state.setDashboardArrangementConfig));

  const formMethods = useForm<FormValues>({
    values: {
      arrangementKey: dashboardArrangementConfig.arrangementKey,
    },
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetDashboardLayout();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetDashboardLayout]);

  useEffect(() => {
    const { arrangementKey } = formValues;
    if (!arrangementKey) {
      return;
    }
    const arrangementOptions = ConfigService.getInstance<CaseDbConfig>().config.dashboard.ARRANGEMENT_OPTIONS;
    const arrangement = arrangementOptions[arrangementKey];
    if (!arrangement) {
      return;
    }

    setDashboardLayoutUserConfig({
      arrangementKey,
      arrangementWidgetAssignments: DashboardUtil.getArrangementWidgetAssignments(arrangement, ConfigService.getInstance<CaseDbConfig>().config.dashboard.DEFAULT_WIDGET_ASSIGNMENTS[arrangementKey]),
    });
  }, [formValues, setDashboardLayoutUserConfig]);

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
              options={ConfigService.getInstance<CaseDbConfig>().config.dashboard.ARRANGEMENT_OPTIONS}
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
