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

import type { EpiDashboardTreeSettings } from '../../../stores/userProfileStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { Switch } from '../../form/fields/Switch';

export type EpiDashboardTreeSettingsFormProps = {
  readonly onReset: () => void;
};

export const EpiDashboardTreeSettingsForm = ({ onReset }: EpiDashboardTreeSettingsFormProps) => {
  const [t] = useTranslation();

  const resetEpiDashboardTreeSettings = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardTreeSettings));
  const epiDashboardTreeSettings = useStore(userProfileStore, useShallow((state) => state.epiDashboardTreeSettings));
  const setEpiDashboardTreeSettings = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardTreeSettings));


  const formMethods = useForm<EpiDashboardTreeSettings>({
    defaultValues: epiDashboardTreeSettings,
    values: epiDashboardTreeSettings,
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetEpiDashboardTreeSettings();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetEpiDashboardTreeSettings]);

  useEffect(() => {
    setEpiDashboardTreeSettings(formValues as EpiDashboardTreeSettings);
  }, [formValues, setEpiDashboardTreeSettings]);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        onSubmit={noop}
      >
        <Box marginY={1}>
          <FormGroup>
            <Switch<EpiDashboardTreeSettings>
              label={t`Show distances`}
              name={'isShowDistancesEnabled'}
            />
          </FormGroup>
        </Box>
      </form>

      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      >
        <Box marginX={1}>
          <Button
            color={'primary'}
            onClick={onResetButtonClick}
            startIcon={<RestartAltIcon />}
            variant={'outlined'}
          >
            {t`Reset tree settings`}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
