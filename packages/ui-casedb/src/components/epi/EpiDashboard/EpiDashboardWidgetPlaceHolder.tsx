import {
  Box,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import {
  use,
  useCallback,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { ConfigManager } from '@gen-epix/ui';

import type { CaseDbConfig } from '../../../models/config';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

import { EpiDashboardZoneContext } from './EpiDashboardZoneContext';

export const EpiDashboardWidgetPlaceHolder = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const userProfileStore = use(UserProfileStoreContext);
  const zoneName = use(EpiDashboardZoneContext);
  const epiDashboardArrangementConfig = useStore(userProfileStore, (state) => state.epiDashboardArrangementConfig);
  const setEpiDashboardArrangementConfig = useStore(userProfileStore, (state) => state.setEpiDashboardArrangementConfig);

  const widgetsConfig = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.WIDGETS;
  const availableWidgets = zoneName
    ? DashboardUtil.getAvailableWidgets(epiDashboardArrangementConfig, zoneName, widgetsConfig)
    : [];

  const onButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const onWidgetSelect = useCallback((widgetName: string) => {
    if (!zoneName) {
      return;
    }
    const { epiDashboardArrangementConfig: config } = userProfileStore.getState();
    setEpiDashboardArrangementConfig({
      ...config,
      arrangementWidgetAssignments: {
        ...config.arrangementWidgetAssignments,
        [zoneName]: widgetName,
      },
    });
    setAnchorEl(null);
  }, [setEpiDashboardArrangementConfig, userProfileStore, zoneName]);

  const onWidgetMenuItemClick = useCallback((event: MouseEvent<HTMLLIElement>) => {
    const widgetName = (event.currentTarget as HTMLElement).dataset['widgetName'];
    if (widgetName) {
      onWidgetSelect(widgetName);
    }
  }, [onWidgetSelect]);

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Button
        onClick={onButtonClick}
        startIcon={<WidgetsIcon />}
        variant={'outlined'}
      >
        {t('Add a widget')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        onClose={onMenuClose}
        open={Boolean(anchorEl)}
      >
        {availableWidgets.length === 0 && (
          <MenuItem disabled>
            {t('No widgets available')}
          </MenuItem>
        )}
        {availableWidgets.map(widgetName => (
          <MenuItem
            data-widget-name={widgetName}
            key={widgetName}
            onClick={onWidgetMenuItemClick}
          >
            {widgetsConfig[widgetName].widgetLabel}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
