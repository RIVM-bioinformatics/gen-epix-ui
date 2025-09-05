import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Box } from '@mui/material';

import type {
  CaseTypeCol,
  CompleteCaseType,
  DataCollection,
} from '../../../api';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import type { TableColumn } from '../../../models/table';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import { Table } from '../../ui/Table';

export type EpiUploadMapDataProps = {
  readonly completeCaseType: CompleteCaseType;
  readonly createdInDataCollectionId: DataCollection;
  readonly rawData: string[][];
  readonly onBack: () => void;
  readonly onProceed: () => void;
};

type RawDataHeader = {
  originalIndex: number;
  originalLabel: string;
  caseTypeCol: CaseTypeCol;
};

type TableRow = {
  [key: string]: string;
};

export const EpiUploadMapData = ({
  completeCaseType,
  createdInDataCollectionId,
  rawData,
  onBack,
  onProceed,
}: EpiUploadMapDataProps) => {
  const [headers, setHeaders] = useState<RawDataHeader[]>(() => {
    if (rawData.length === 0) {
      return [];
    }
    return rawData[0].map((label, index) => {
      return {
        originalIndex: index,
        originalLabel: label,
        caseTypeCol: Object.values(completeCaseType.case_type_cols).find(caseTypeCol => {
          if (!label || typeof label !== 'string') {
            return false;
          }
          const labelLowerCase = label.toLocaleLowerCase();
          return labelLowerCase === caseTypeCol.label.toLocaleLowerCase() || labelLowerCase === caseTypeCol.code.toLowerCase() || labelLowerCase === caseTypeCol.id.toLocaleLowerCase();
        }) || null,
      };
    });
  });

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
    return headers.map((header) => {
      return {
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: `col-${header.originalIndex}`,
        headerName: (header.caseTypeCol ? header.caseTypeCol.code : header.originalLabel) || `Column ${header.originalIndex + 1}`,
        valueGetter: (params) => params.row[header.originalIndex],
        widthPx: 250,
      } satisfies TableColumn<TableRow>;
    });
  }, [headers]);

  const getRowName = useCallback((row: TableRow) => {
    return row[0] || 'Row';
  }, []);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: tableRows, createFiltersFromColumns: true });

  return (
    <TableStoreContextProvider store={tableStore}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <Table
          getRowName={getRowName}
        />
      </Box>
    </TableStoreContextProvider>
  );
};
