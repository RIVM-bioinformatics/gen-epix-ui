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
  TableDownloadSidebarItem,
  TableDownloadSidebarItemIcon,
} from './TableDownloadSidebarItem';
import {
  TableFiltersSidebarItem,
  TableFiltersSidebarItemIcon,
} from './TableFiltersSidebarItem';


export type TableSidebarMenuProps = {
  readonly downloadAsFileName?: string;
  readonly extraSidebarMenuItems?: ReactNode;
};

export const TableSidebarMenu = <TRowData, TDataContext = null>({ downloadAsFileName, extraSidebarMenuItems }: TableSidebarMenuProps) => {
  const tableStore = useTableStoreContext<TRowData, TDataContext>();

  const activeFiltersCount = useStore(tableStore, (state) => state.filters.filter(filter => filter.isFilterActive()).length);

  const [isTableFiltersSidebarItemOpen, setIsTableFiltersSidebarItemOpen] = useState(false);
  const [isTableDownloadSidebarItemOpen, setIsTableDownloadSidebarItemOpen] = useState(false);

  const onFilterSidebarClose = useCallback(() => {
    setIsTableFiltersSidebarItemOpen(false);
  }, []);

  const onDownloadSidebarClose = useCallback(() => {
    setIsTableDownloadSidebarItemOpen(false);
  }, []);

  const onOpenFilterSidebarButtonClick = useCallback(() => {
    setIsTableFiltersSidebarItemOpen(true);
  }, []);

  const onOpenDownloadSidebarButtonClick = useCallback(() => {
    setIsTableDownloadSidebarItemOpen(true);
  }, []);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem
          badgeColor={'secondary'}
          badgeContent={activeFiltersCount}
          first
          icon={<TableFiltersSidebarItemIcon />}
          onClick={onOpenFilterSidebarButtonClick}
          testIdAttributes={{ name: 'filters' }}
          title={t`Open filters`}
        />
        <SidebarMenuItem
          badgeColor={'secondary'}
          icon={<TableDownloadSidebarItemIcon />}
          onClick={onOpenDownloadSidebarButtonClick}
          testIdAttributes={{ name: 'download' }}
          title={t`Open download`}
        />
        {extraSidebarMenuItems}
      </SidebarMenu>
      <TableFiltersSidebarItem
        onClose={onFilterSidebarClose}
        open={isTableFiltersSidebarItemOpen}
      />
      <TableDownloadSidebarItem
        downloadAsFileName={downloadAsFileName}
        onClose={onDownloadSidebarClose}
        open={isTableDownloadSidebarItemOpen}
      />
    </>
  );
};
