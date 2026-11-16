// FIXME split component
/* eslint-disable @eslint-react/kit/no-multi-comp */

import { useTranslation } from 'react-i18next';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Link,
  Typography,
} from '@mui/material';
import { useCallback } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { SidebarItem } from '../Sidebar';
import { useTableStoreContext } from '../../../stores/tableStore';
import type { SidebarItemSharedProps } from '../Sidebar';
import { TableUtil } from '../../../utils/TableUtil';


export type TableDownloadSidebarItemContentProps = {
  readonly downloadAsFileName?: string;
};

export type TableDownloadSidebarItemProps = SidebarItemSharedProps & TableDownloadSidebarItemContentProps;

export const TableDownloadSidebarItemIcon = DownloadIcon;


export const TableDownloadSidebarItemContent = <TRowData, TDataContext>({ downloadAsFileName }: TableDownloadSidebarItemContentProps) => {
  const { t } = useTranslation();

  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const hasSelectedRows = useStore(tableStore, useShallow((state) => state.selectedIds.length > 0));
  const dataContext = useStore(tableStore, useShallow((state) => state.dataContext));

  const getVisibleColumnIds = useCallback(() => {
    return tableStore.getState().getCurrentColumnVisualSettings().filter(x => x.isVisible).map(x => x.id);
  }, [tableStore]);

  const getColumns = useCallback(() => {
    return tableStore.getState().columns;
  }, [tableStore]);

  const getSelectedRows = useCallback(() => {
    const { idSelectorCallback, selectedIds, sortedData } = tableStore.getState();
    return sortedData.filter(row => selectedIds.includes(idSelectorCallback(row)));
  }, [tableStore]);

  const onDownloadAllRowsAsExcel = useCallback(async () => {
    await TableUtil.downloadAsExcel(
      tableStore.getState().sortedData,
      getVisibleColumnIds(),
      getColumns(),
      downloadAsFileName ? `${downloadAsFileName}.xlsx` : 'all_rows.xlsx',
      dataContext,
    );
  }, [dataContext, downloadAsFileName, getColumns, getVisibleColumnIds, tableStore]);

  const onDownloadAllRowsAsCSV = useCallback(() => {
    TableUtil.downloadAsCSV(
      tableStore.getState().sortedData,
      getVisibleColumnIds(),
      getColumns(),
      downloadAsFileName ? `${downloadAsFileName}.csv` : 'all_rows.csv',
      dataContext,
    );
  }, [dataContext, downloadAsFileName, getColumns, getVisibleColumnIds, tableStore]);

  const onDownloadSelectedRowsAsExcel = useCallback(async () => {
    await TableUtil.downloadAsExcel(
      getSelectedRows(),
      getVisibleColumnIds(),
      getColumns(),
      downloadAsFileName ? `${downloadAsFileName}__selected_rows.xlsx` : 'selected_rows.xlsx',
      dataContext,
    );
  }, [dataContext, downloadAsFileName, getColumns, getSelectedRows, getVisibleColumnIds]);

  const onDownloadSelectedRowsAsCSV = useCallback(() => {
    TableUtil.downloadAsCSV(
      getSelectedRows(),
      getVisibleColumnIds(),
      getColumns(),
      downloadAsFileName ? `${downloadAsFileName}__selected_rows.csv` : 'selected_rows.csv',
      dataContext,
    );
  }, [dataContext, downloadAsFileName, getColumns, getSelectedRows, getVisibleColumnIds]);

  return (
    <>
      <Box>
        <Typography variant={'h6'}>
          {t`All rows`}
        </Typography>
        <Box
          sx={{ marginLeft: 1 }}
        >
          <Box>
            <Link
              component={'button'}
              onClick={onDownloadAllRowsAsExcel}
              tabIndex={0}
            >
              {t`Download all rows as Excel`}
            </Link>
          </Box>
          <Box>
            <Link
              component={'button'}
              onClick={onDownloadAllRowsAsCSV}
              tabIndex={0}
            >
              {t`Download all rows as CSV`}
            </Link>
          </Box>
        </Box>
      </Box>
      {hasSelectedRows && (
        <Box sx={{ my: 1 }}>
          <Typography variant={'h6'}>
            {t`Selected rows`}
          </Typography>
          <Box
            sx={{ marginLeft: 1 }}
          >
            <Box>
              <Link
                component={'button'}
                onClick={onDownloadSelectedRowsAsExcel}
                tabIndex={0}
              >
                {t`Download selected rows as Excel`}
              </Link>
            </Box>
            <Box>
              <Link
                component={'button'}
                onClick={onDownloadSelectedRowsAsCSV}
                tabIndex={0}
              >
                {t`Download selected rows as CSV`}
              </Link>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );

};

export const TableDownloadSidebarItem = ({ downloadAsFileName, onClose, open }: TableDownloadSidebarItemProps) => {
  const { t } = useTranslation();

  return (
    <SidebarItem
      closeIcon={<TableDownloadSidebarItemIcon />}
      closeIconTooltipText={t`Close download`}
      onClose={onClose}
      open={open}
      testIdAttributes={{ name: 'tableDownloadSidebarItem' }}
      title={t`Download`}
      width={60}
    >
      {open && <TableDownloadSidebarItemContent downloadAsFileName={downloadAsFileName} />}
    </SidebarItem>
  );
};
