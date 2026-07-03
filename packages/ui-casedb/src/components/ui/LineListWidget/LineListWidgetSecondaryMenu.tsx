import {
  use,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import LinkIcon from '@mui/icons-material/Link';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useTheme } from '@mui/material';
import type { MenuItemData } from '@gen-epix/ui';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { WidgetMenu } from '../WidgetMenu';
import { EventBusService } from '../../../classes/services/EventBusService';

export const LineListWidgetSecondaryMenu = () => {
  const theme = useTheme();
  const dashboardStore = use(DashboardStoreContext);
  const { t } = useTranslation();
  const isTreeLinked = useStore(dashboardStore, useShallow((state) => state.treeWidgetData.zoomLevel === 1));
  const setSorting = useStore(dashboardStore, useShallow((state) => state.setSorting));

  const onLinkButtonClick = useCallback(() => {
    const perform = async () => {
      await setSorting(null, null);
      EventBusService.getInstance().emit('onLinkLineListAndTree');
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [setSorting]);

  const menu = useMemo<MenuItemData[]>(() => {
    return [
      {
        callback: onLinkButtonClick,
        disabled: isTreeLinked,
        label: t`Link and snap the Tree to the Line list (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
      },
    ];
  }, [isTreeLinked, onLinkButtonClick, t, theme.palette.error.main]);

  return <WidgetMenu menu={menu} />;
};
