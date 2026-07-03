import {
  Box,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FieldValues } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  ConfigService,
  FormUtil,
  GenericForm,
} from '@gen-epix/ui';

import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import type { CaseDbConfig } from '../../../models/config';

export type DashboardEpiCurveSettingsFormProps = {
  readonly widgetName: string;
};

export const DashboardWidgetSettingsForm = ({ widgetName }: DashboardEpiCurveSettingsFormProps) => {
  const { t } = useTranslation();
  const userProfileStore = use(UserProfileStoreContext);
  const formId = useId();

  const resetWidgetSettings = useStore(userProfileStore, useShallow((state) => state.resetWidgetSettings));
  const setWidgetSettings = useStore(userProfileStore, useShallow((state) => state.setWidgetSettings));
  const formFieldDefinitions = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS[widgetName].configFormFieldsDefinitions;
  const defaultFormValues = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS[widgetName].configDefaultValues;

  const schema = useMemo(() => {
    if (!formFieldDefinitions) {
      return undefined;
    }
    return FormUtil.createYupSchemaFromFormFieldDefinitions(formFieldDefinitions);
  }, [formFieldDefinitions]);

  const formMethods = useForm<FieldValues>({
    defaultValues: defaultFormValues,
    values: defaultFormValues,
  });
  const { control } = formMethods;

  const formValues = useWatch({ control });

  const onResetButtonClick = useCallback(() => {
    resetWidgetSettings(widgetName);
  }, [resetWidgetSettings, widgetName]);

  useEffect(() => {
    setWidgetSettings(widgetName, formValues);
  }, [formValues, setWidgetSettings, widgetName]);

  const onSubmit = useCallback(() => {
    // No submit action needed since changes are applied immediately
  }, []);

  return (
    <Box>
      <Box
        sx={{
          marginY: 1,
        }}
      >
        <GenericForm<FieldValues>
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={onSubmit}
          schema={schema}
        />
      </Box>
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
            {t('Reset {widgetName} settings', { widgetName })}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
