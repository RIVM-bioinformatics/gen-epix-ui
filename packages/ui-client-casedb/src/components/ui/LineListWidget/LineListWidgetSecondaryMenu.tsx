import { container } from 'tsyringe';
import {
  use,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type { MenuItemData } from '@gen-epix/ui-core-components/models/nested-menu.models';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { WidgetMenu } from '../WidgetMenu';
import { TreeLineListLinkToggle } from '../TreeLineListLinkToggle';
import { EventBusService } from '../../../classes/services/EventBusService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { TreeWidgetData } from '../../../models/dashboard.models';

export const LineListWidgetSecondaryMenu = () => {
  const dashboardStore = use(DashboardStoreContext);
  const { t } = useTranslation();
  const isTreeLinked = useStore(dashboardStore, (state) => state.getWidgetData<TreeWidgetData>(DASHBOARD_COMPONENT_NAME.TREE).zoomLevel === 1);
  const setSorting = useStore(dashboardStore, (state) => state.setSorting);

  const onLinkToggleClick = useCallback(() => {
    if (isTreeLinked) {
      container.resolve(EventBusService).emit('onUnlinkLineListAndTree', { userInitiated: true });
      return;
    }

    const perform = async () => {
      await setSorting(null, null);
      container.resolve(EventBusService).emit('onLinkLineListAndTree');
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [isTreeLinked, setSorting]);

  const menu = useMemo<MenuItemData[]>(() => {
    return [
      {
        callback: onLinkToggleClick,
        label: isTreeLinked ? t`Unlink Tree and Line List` : t`Link Tree and Line List`,
        leftIcon: <TreeLineListLinkToggle isLinked={isTreeLinked} />,
        uid: 'tree-line-list-link-toggle',
      },
    ];
  }, [isTreeLinked, onLinkToggleClick, t]);

  return <WidgetMenu menu={menu} />;
};
