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
  useCallback,
  useEffect,
} from 'react';
import { useStore } from 'zustand';
import noop from 'lodash/noop';
import { useShallow } from 'zustand/shallow';

import type { EpiDashboardGeneralSettings } from '../../../stores/userProfileStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { Switch } from '../../form/fields/Switch';

export type EpiDashboardGeneralSettingsFormProps = {
  readonly onReset: () => void;
};

export const EpiDashboardGeneralSettingsForm = ({ onReset }: EpiDashboardGeneralSettingsFormProps) => {
  const { t } = useTranslation();

  const resetEpiDashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardGeneralSettings));
  const epiDashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.epiDashboardGeneralSettings));
  const setEpiDashboardGeneralSettings = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardGeneralSettings));

  const formMethods = useForm<EpiDashboardGeneralSettings>({
    defaultValues: epiDashboardGeneralSettings,
    values: epiDashboardGeneralSettings,
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetEpiDashboardGeneralSettings();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetEpiDashboardGeneralSettings]);

  useEffect(() => {
    setEpiDashboardGeneralSettings(formValues as EpiDashboardGeneralSettings);
  }, [formValues, setEpiDashboardGeneralSettings]);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        onSubmit={noop}
      >
        <Box marginY={1}>
          <FormGroup>
            <Switch<EpiDashboardGeneralSettings>
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
        <Box marginX={1}>
          <Button
            color={'primary'}
            startIcon={<RestartAltIcon />}
            variant={'outlined'}
            onClick={onResetButtonClick}
          >
            {t`Reset general settings`}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
