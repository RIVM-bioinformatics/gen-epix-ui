import { t } from 'i18next';
import type { ReactNode } from 'react';
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

export type TableSidebarMenuProps = {
  readonly extraSidebarMenuItems?: ReactNode;
};

export const TableSidebarMenu = <TRowData, TDataContext = null>({ extraSidebarMenuItems }: TableSidebarMenuProps) => {
  const tableStore = useTableStoreContext<TRowData, TDataContext>();

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
        {extraSidebarMenuItems}
      </SidebarMenu>
      <TableFiltersSidebarItem
        onClose={onEpiDashboardFilterSidebarClose}
        open={isTableFiltersSidebarItemOpen}
      />
    </>
  );
};
