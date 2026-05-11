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
import { SidebarItem } from '@gen-epix/ui';

import { EpiDashboardGeneralSettingsForm } from './EpiDashboardGeneralSettingsForm';
import { EpiDashboardLayoutSettingsForm } from './EpiDashboardLayoutSettingsForm';
import { EpiDashboardTreeSettingsForm } from './EpiDashboardTreeSettingsForm';

export type EpiDashboardSettingsSidebarItemProps = {
  readonly onReset: () => void;
} & SidebarItemSharedProps;
type EpiDashboardSettingsSidebarItemContentProps = Pick<EpiDashboardSettingsSidebarItemProps, 'onReset'>;

export const EpiDashboardSettingsSidebarItemIcon = SettingsIcon;

const EpiDashboardSettingsSidebarItemContent = ({ onReset }: EpiDashboardSettingsSidebarItemContentProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const items = useMemo(() => [
    {
      component: <EpiDashboardGeneralSettingsForm onReset={onReset} />,
      label: t`General`,
    },
    {
      component: <EpiDashboardTreeSettingsForm onReset={onReset} />,
      label: t`Phylogenetic tree`,
    },
    {
      component: <EpiDashboardLayoutSettingsForm onReset={onReset} />,
      label: t`Dashboard layout`,
    },
  ], [onReset, t]);

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
          <Typography variant={'h5'}>
            {label}
          </Typography>
          <Box
            sx={{
              marginBottom: 2,
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
export const EpiDashboardSettingsSidebarItem = ({ onClose, onReset, open }: EpiDashboardSettingsSidebarItemProps) => {
  const { t } = useTranslation();

  return (
    <SidebarItem
      closeIcon={<EpiDashboardSettingsSidebarItemIcon />}
      closeIconTooltipText={t`Close settings`}
      onClose={onClose}
      open={open}
      testIdAttributes={{ name: 'EpiDashboardSettingsSidebarItem' }}
      title={t`Settings`}
      width={60}
    >
      {open && <EpiDashboardSettingsSidebarItemContent onReset={onReset} />}
    </SidebarItem>
  );
};
