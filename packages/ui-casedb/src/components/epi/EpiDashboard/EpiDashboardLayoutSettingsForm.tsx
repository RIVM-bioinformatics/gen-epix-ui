import {
  Box,
  Button,
  FormGroup,
  Typography,
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
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type {
  EpiDashboardLayoutConfig,
  EpiDashboardLayoutUserConfig,
} from '../../../../../ui-casedb/src/models/epi';
import { EPI_ZONE } from '../../../../../ui-casedb/src/models/epi';
import type { ToggleButtonOption } from '../../../models/form';
import { userProfileStore } from '../../../stores/userProfileStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { Switch } from '../../form/fields/Switch';
import { ToggleButtonGroup } from '../../form/fields/ToggleButtonGroup';

export type EpiDashboardLayoutSettingsFormProps = {
  readonly onReset: () => void;
};

type LayoutFormElements = Array<{ disabled?: boolean; epiZone: EPI_ZONE; label: string }>;

export const EpiDashboardLayoutSettingsForm = ({ onReset }: EpiDashboardLayoutSettingsFormProps) => {
  const { t } = useTranslation();

  const resetEpiDashboardLayout = useStore(userProfileStore, useShallow((state) => state.resetEpiDashboardLayout));
  const epiDashboardLayoutUserConfig = useStore(userProfileStore, useShallow((state) => state.epiDashboardLayoutUserConfig));
  const setEpiDashboardLayoutUserConfig = useStore(userProfileStore, useShallow((state) => state.setEpiDashboardLayoutUserConfig));

  const layoutConfig: EpiDashboardLayoutConfig = DashboardUtil.getDashboardLayoutConfig(epiDashboardLayoutUserConfig) ?? { layouts: [], zones: [] };

  const arrangementOptions = useMemo<ToggleButtonOption[]>(() => layoutConfig.layouts.map<ToggleButtonOption>((_layout, index) => ({
    disabled: false,
    label: index === 0 ? t`Default` : t('Alternative {{index}}', { index }),
    value: index,
  })), [layoutConfig.layouts, t]);

  const layoutFormElements = useMemo<LayoutFormElements>(() => {
    const elements: LayoutFormElements = [
      {
        epiZone: EPI_ZONE.LINE_LIST,
        label: t`Show line list`,
      },
      {
        epiZone: EPI_ZONE.TREE,
        label: t`Show phylogenetic tree`,
      },
      {
        epiZone: EPI_ZONE.EPI_CURVE,
        label: t`Show epi curve`,
      },
      {
        epiZone: EPI_ZONE.MAP,
        label: t`Show map`,
      },
    ];
    return elements;
  }, [t]);

  const formMethods = useForm<EpiDashboardLayoutUserConfig>({
    values: epiDashboardLayoutUserConfig,
  });
  const { control, setValue } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetEpiDashboardLayout();
    if (onReset) {
      onReset();
    }
  }, [onReset, resetEpiDashboardLayout]);

  useEffect(() => {
    if (formValues.arrangement >= layoutConfig.layouts.length) {
      setValue('arrangement', 0);
    }
  }, [formValues.arrangement, layoutConfig.layouts.length, setValue]);

  useEffect(() => {
    setEpiDashboardLayoutUserConfig(formValues as EpiDashboardLayoutUserConfig);
  }, [formValues, layoutFormElements, setEpiDashboardLayoutUserConfig]);

  const onLayoutChange = useCallback(() => {
    setValue('arrangement', 0);
  }, [setValue]);

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
            {layoutFormElements.map(layoutFormElement => (
              <Switch
                key={layoutFormElement.epiZone}
                label={layoutFormElement.label}
                name={`zones.${layoutFormElement.epiZone}`}
                onChange={onLayoutChange}
              />
            ))}
          </FormGroup>
        </Box>
        <Box
          sx={{
            marginY: 1,
          }}
        >
          <Typography variant={'h6'}>
            {t`Arrangement`}
          </Typography>
        </Box>
        {arrangementOptions.length > 0 && (
          <Box
            sx={{
              marginY: 1,
            }}
          >
            <FormGroup>
              <ToggleButtonGroup
                disabled={layoutConfig.layouts.length < 1}
                name={'arrangement'}
                options={arrangementOptions}
                required
              />
            </FormGroup>
          </Box>
        )}
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
