import { t } from 'i18next';
import {
  useCallback,
  useState,
} from 'react';
import { useStore } from 'zustand';

import {
  SidebarMenu,
  SidebarMenuItem,
} from '../Sidebar';
import { useTableStoreContext } from '../../../stores/tableStore';

import {
  TableFiltersSidebarItem,
  TableFiltersSidebarItemIcon,
} from './TableFiltersSidebarItem';

export const TableSidebarMenu = <TRowData, >() => {
  const tableStore = useTableStoreContext<TRowData>();

  const activeFiltersCount = useStore(tableStore, (state) => state.filters.filter(f => !f.isInitialFilterValue()).length);

  const [isTableFiltersSidebarItemOpen, setIsTableFiltersSidebarItemOpen] = useState(false);

  const onEpiDashboardFilterSidebarClose = useCallback(() => {
    setIsTableFiltersSidebarItemOpen(false);
  }, []);

  const onEpiDashboardOpenFilterSidebarButtonClick = useCallback(() => {
    setIsTableFiltersSidebarItemOpen(true);
  }, []);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem
          badgeColor={'secondary'}
          badgeContent={activeFiltersCount}
          first
          icon={<TableFiltersSidebarItemIcon />}
          onClick={onEpiDashboardOpenFilterSidebarButtonClick}
          testIdAttributes={{ name: 'filters' }}
          title={t`Open filters`}
        />
      </SidebarMenu>
      <TableFiltersSidebarItem
        onClose={onEpiDashboardFilterSidebarClose}
        open={isTableFiltersSidebarItemOpen}
      />
    </>
  );
};
