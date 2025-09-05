import {
  Box,
  Link,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from 'react';

import type { SidebarItemSharedProps } from '../../ui/Sidebar';
import { SidebarItem } from '../../ui/Sidebar';
import type {
  DownloadConfig,
  DownloadConfigItem,
  DownloadConfigSection,
} from '../../../classes/managers/EpiEventBusManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';


export type EpiDashboardDownloadSidebarItemProps = SidebarItemSharedProps;

export const EpiDashboardDownloadSidebarItemIcon = DownloadIcon;

const EpiDashboardDownloadSidebarItemContent = () => {
  const theme = useTheme();
  const [t] = useTranslation();
  const [downloadConfigs, setDownloadConfigs] = useState<DownloadConfig[]>([]);

  useEffect(() => {
    EpiEventBusManager.instance.addEventListener('onDownloadOptionsChanged', (payload) => {
      if (!payload?.zone) {
        return;
      }
      setDownloadConfigs(prevDownloadOptions => {
        if (payload.items === null) {
          return prevDownloadOptions.filter(item => item.zone !== payload.zone);
        }
        return [
          ...prevDownloadOptions.filter(item => item.zone !== payload.zone),
          payload,
        ].sort((a, b) => {
          return ConfigManager.instance.config.epi.DOWNLOAD_SECTION_ORDER.indexOf(a.zone) - ConfigManager.instance.config.epi.DOWNLOAD_SECTION_ORDER.indexOf(b.zone);
        });
      });
    });
    EpiEventBusManager.instance.emit('onDownloadOptionsRequested');
  }, []);

  const renderDownloadItem = useCallback((item: DownloadConfigItem, forceDisabled?: boolean) => {
    return (
      <Box
        key={item.label}
        sx={{ marginLeft: 1 }}
      >
        {(forceDisabled || item.disabled || !item.callback) ? (
          <Typography>
            {item.label}
          </Typography>
        ) : (
          <Link
            tabIndex={0}
            component={'button'}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => item.callback()}
          >
            {item.label}
          </Link>
        )}
      </Box>
    );
  }, []);

  const renderDownloadSection = useCallback((section: DownloadConfigSection) => {
    return (
      <Box key={section.label}>
        <Typography variant={'h6'}>
          {section.label}
        </Typography>
        {section.items.map(item => renderDownloadItem(item, section.disabled))}
      </Box>
    );
  }, [renderDownloadItem]);

  return (
    <Box
      sx={{
        width: theme.spacing(59),
      }}
    >
      {downloadConfigs.map((config) => (
        <Box
          key={config.zone}
          sx={{
            padding: theme.spacing(1),
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography
              color={config.disabled ? theme.palette.text.disabled : undefined}
              variant={'h5'}
            >
              {config.zoneLabel}
            </Typography>
          </Box>
          {config.disabled && (
            <Box sx={{ padding: theme.spacing(1) }}>
              <Typography>
                {t`No data available for download.`}
              </Typography>
            </Box>
          )}
          {!config.disabled && config.items.map((item) => {
            if ('items' in item && item.disabled) {
              return null;
            }
            return (
              <Fragment key={item.label}>
                {'items' in item
                  ? renderDownloadSection(item)
                  : renderDownloadItem(item)}
              </Fragment>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export const EpiDashboardDownloadSidebarItem = ({ open, onClose }: EpiDashboardDownloadSidebarItemProps) => {
  const [t] = useTranslation();

  return (
    <SidebarItem
      closeIcon={<EpiDashboardDownloadSidebarItemIcon />}
      closeIconTooltipText={t`Close download`}
      open={open}
      title={t`Download`}
      width={60}
      onClose={onClose}
    >
      {open && <EpiDashboardDownloadSidebarItemContent />}
    </SidebarItem>
  );
};
