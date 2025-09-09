import {
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  Button,
} from '@mui/material';
import { t } from 'i18next';

import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import type { TableColumn } from '../../../models/table';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import { Table } from '../../ui/Table';
import type { EpiUploadMappedColumn } from '../../../models/epiUpload';

export type EpiUploadDataPreviewProps = {
  readonly mappedColumns?: EpiUploadMappedColumn[];
  readonly rawData: string[][];
  readonly onGoBack: () => void;
  readonly onProceed: () => void;
};

type TableRow = {
  [key: string]: string;
};

export const EpiUploadDataPreview = ({
  mappedColumns,
  rawData,
  onGoBack,
  onProceed,
}: EpiUploadDataPreviewProps) => {
  const tableRows = useMemo<TableRow[]>(() => {
    return rawData.slice(1).map((row) => {
      const tableRow: TableRow = {};
      row.forEach((cell, index) => {
        tableRow[index.toString()] = cell;
      });
      return tableRow;
    });
  }, [rawData]);

  const tableStore = useMemo(() => createTableStore<TableRow>({
    idSelectorCallback: () => null,
  }), []);

  const tableColumns = useMemo<TableColumn<TableRow>[]>(() => {
    return mappedColumns.filter(mappedColumn => mappedColumn.caseTypeCol || mappedColumn.isCaseDateColumn || mappedColumn.isCaseIdColumn).map((mappedColumn) => {
      let headerName = t('Column {{number}}', { number: mappedColumn.originalIndex + 1 });
      if (mappedColumn.caseTypeCol) {
        headerName = mappedColumn.caseTypeCol.code;
      } else if (mappedColumn.isCaseIdColumn) {
        headerName = t('case_id');
      } else if (mappedColumn.isCaseDateColumn) {
        headerName = t('case_date');
      }
      return {
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: `col-${mappedColumn.originalIndex}`,
        headerName,
        valueGetter: (params) => params.row[mappedColumn.originalIndex],
        widthPx: 250,
      } satisfies TableColumn<TableRow>;
    });
  }, [mappedColumns]);

  const getRowName = useCallback((row: TableRow) => {
    return row[0] || 'Row';
  }, []);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: tableRows, createFiltersFromColumns: true });

  const onProceedButtonClick = useCallback(() => {
    onProceed();
  }, [onProceed]);

  return (
    <TableStoreContextProvider store={tableStore}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'grid',
          gridTemplateRows: 'auto max-content',
        }}
      >
        <Table
          getRowName={getRowName}
        />
        <Box
          paddingY={1}
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant={'outlined'}
            onClick={onGoBack}
          >
            {t('Go back')}
          </Button>
          <Button
            variant={'contained'}
            onClick={onProceedButtonClick}
          >
            {t('Proceed')}
          </Button>
        </Box>
      </Box>
    </TableStoreContextProvider>
  );
};
