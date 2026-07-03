import {
  Box,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import { useMemo } from 'react';
import type { SidebarItemSharedProps } from '@gen-epix/ui';
import {
  ConfigService,
  SidebarItem,
} from '@gen-epix/ui';

import type { CaseDbConfig } from '../../../models/config';

import { DashboardGeneralSettingsForm } from './DashboardGeneralSettingsForm';
import { DashboardLayoutSettingsForm } from './DashboardLayoutSettingsForm';
import { DashboardWidgetSettingsForm } from './DashboardWidgetSettingsForm';

export type DashboardSettingsSidebarItemProps = {
  readonly onReset: () => void;
} & SidebarItemSharedProps;
type DashboardSettingsSidebarItemContentProps = Pick<DashboardSettingsSidebarItemProps, 'onReset'>;

export const DashboardSettingsSidebarItemIcon = SettingsIcon;

const DashboardSettingsSidebarItemContent = ({ onReset }: DashboardSettingsSidebarItemContentProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const items = useMemo(() => {
    const x = [
      {
        component: <DashboardLayoutSettingsForm onReset={onReset} />,
        label: t`Dashboard layout`,
      },
      {
        component: <DashboardGeneralSettingsForm />,
        label: t`General`,
      },
    ];
    Object.entries(ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS).forEach(([widgetName, widgetConfig]) => {
      if (widgetConfig.configFormFieldsDefinitions) {
        x.push({
          component: <DashboardWidgetSettingsForm widgetName={widgetName} />,
          label: widgetConfig.widgetLabel,
        });
      }
    });
    return x;
  }, [onReset, t]);

  return (
    <Box
      sx={{
        width: theme.spacing(59),
      }}
    >
      {items.map(({ component, label }, index) => (
        <Box
          key={label}
          sx={{
            marginTop: index !== 0 ? 2 : 0,
            paddingTop: index !== items.length - 1 ? 1 : 0,
          }}
        >
          <Box
            sx={{
              marginBottom: 2,
            }}
          >
            <Typography variant={'h5'}>
              {label}
            </Typography>
          </Box>
          <Box
            sx={{
              marginBottom: 2,
              marginRight: 1,
            }}
          >
            {component}
          </Box>
          <Divider
            flexItem
            orientation={'horizontal'}
            sx={{
              marginLeft: 0,
              marginRight: 1,
            }}
            variant={'middle'}
          />
        </Box>
      ))}
    </Box>
  );
};

// eslint-disable-next-line @eslint-react/kit/no-multi-comp
export const DashboardSettingsSidebarItem = ({ onClose, onReset, open }: DashboardSettingsSidebarItemProps) => {
  const { t } = useTranslation();

  return (
    <SidebarItem
      closeIcon={<DashboardSettingsSidebarItemIcon />}
      closeIconTooltipText={t`Close settings`}
      onClose={onClose}
      open={open}
      testIdAttributes={{ name: 'DashboardSettingsSidebarItem' }}
      title={t`Settings`}
      width={60}
    >
      {open && <DashboardSettingsSidebarItemContent onReset={onReset} />}
    </SidebarItem>
  );
};
