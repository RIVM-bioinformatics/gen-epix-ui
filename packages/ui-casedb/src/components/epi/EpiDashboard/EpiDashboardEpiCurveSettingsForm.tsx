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
import { useShallow } from 'zustand/shallow';
import { Switch } from '@gen-epix/ui';

import type { EpiDashboardEpiCurveSettings } from '../../../stores/userProfileStore';
import { userProfileStore } from '../../../stores/userProfileStore';

export type EpiDashboardEpiCurveSettingsFormProps = {
  readonly onReset: () => void;
};

export const EpiDashboardEpiCurveSettingsForm = ({ onReset }: EpiDashboardEpiCurveSettingsFormProps) => {
  const { t } = useTranslation();

  const resetEpiDashboardEpiCurveSettings = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardEpiCurveSettings));
  const epiDashboardEpiCurveSettings = useStore(userProfileStore, useShallow((state) => state.epiDashboardEpiCurveSettings));
  const setEpiDashboardEpiCurveSettings = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardEpiCurveSettings));


  const formMethods = useForm<EpiDashboardEpiCurveSettings>({
    defaultValues: epiDashboardEpiCurveSettings,
    values: epiDashboardEpiCurveSettings,
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetEpiDashboardEpiCurveSettings();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetEpiDashboardEpiCurveSettings]);

  useEffect(() => {
    setEpiDashboardEpiCurveSettings(formValues as EpiDashboardEpiCurveSettings);
  }, [formValues, setEpiDashboardEpiCurveSettings]);

  const onSubmit = useCallback(() => {
    // No submit action needed since changes are applied immediately
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
            <Switch<EpiDashboardEpiCurveSettings>
              label={t`Show missing values in area chart`}
              name={'isShowMissingValuesInAreaChartEnabled'}
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
            {t`Reset epi curve settings`}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
