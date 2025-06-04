import {
  Box,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import { useMemo } from 'react';

import type { SidebarItemSharedProps } from '../../ui/Sidebar';
import { SidebarItem } from '../../ui/Sidebar';

import { EpiDashboardGeneralSettingsForm } from './EpiDashboardGeneralSettingsForm';
import { EpiDashboardLayoutSettingsForm } from './EpiDashboardLayoutSettingsForm';
import { EpiDashboardTreeSettingsForm } from './EpiDashboardTreeSettingsForm';

export type EpiDashboardSettingsSidebarItemProps = SidebarItemSharedProps & {
  readonly onReset: () => void;
};
type EpiDashboardSettingsSidebarItemContentProps = Pick<EpiDashboardSettingsSidebarItemProps, 'onReset'>;

export const EpiDashboardSettingsSidebarItemIcon = SettingsIcon;

const EpiDashboardSettingsSidebarItemContent = ({ onReset }: EpiDashboardSettingsSidebarItemContentProps) => {
  const theme = useTheme();
  const [t] = useTranslation();

  const items = useMemo(() => [
    {
      label: t`General`,
      component: <EpiDashboardGeneralSettingsForm onReset={onReset} />,
    },
    {
      label: t`Phylogenetic tree`,
      component: <EpiDashboardTreeSettingsForm onReset={onReset} />,
    },
    {
      label: t`Dashboard layout`,
      component: <EpiDashboardLayoutSettingsForm onReset={onReset} />,
    },
  ], [onReset, t]);

  return (
    <Box sx={{
      width: theme.spacing(59),
    }}
    >
      {items.map(({ label, component }, index) => (
        <Box
          key={label}
          marginTop={index !== 0 ? 2 : 0}
          paddingTop={index !== items.length - 1 ? 1 : 0}
        >
          <Typography variant={'h5'}>
            {label}
          </Typography>
          <Box marginBottom={2}>
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

export const EpiDashboardSettingsSidebarItem = ({ open, onClose, onReset }: EpiDashboardSettingsSidebarItemProps) => {
  const [t] = useTranslation();

  return (
    <SidebarItem
      closeIcon={<EpiDashboardSettingsSidebarItemIcon />}
      closeIconTooltipText={t`Close settings`}
      onClose={onClose}
      open={open}
      title={t`Settings`}
      width={60}
    >
      {open && <EpiDashboardSettingsSidebarItemContent onReset={onReset} />}
    </SidebarItem>
  );
};
