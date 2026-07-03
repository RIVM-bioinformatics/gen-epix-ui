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
import { Switch } from '@gen-epix/ui';

import type { DashboardGeneralSettings } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

export const DashboardGeneralSettingsForm = () => {
  const { t } = useTranslation();
  const userProfileStore = use(UserProfileStoreContext);

  const resetDashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.resetDashboardGeneralSettings));
  const dashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.dashboardGeneralSettings));
  const setDashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.setDashboardGeneralSettings));

  const formMethods = useForm<DashboardGeneralSettings>({
    defaultValues: dashboardGeneralSettings,
    values: dashboardGeneralSettings,
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetDashboardGeneralSettings();
  }, [resetDashboardGeneralSettings]);

  useEffect(() => {
    setDashboardGeneralSettings(formValues as DashboardGeneralSettings);
  }, [formValues, setDashboardGeneralSettings]);

  const onSubmit = useCallback(() => {
    // noop, as the form only contains switches that update the state on change
  }, []);

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
            <Switch<DashboardGeneralSettings>
              label={t`Enable highlighting across widgets`}
              name={'isHighlightingEnabled'}
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
            {t`Reset general settings`}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
