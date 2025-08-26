import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useMemo,
} from 'react';

import {
  Table,
  TableHeader,
} from '../Table';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import type { TableColumn } from '../../../models/table';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import { StringUtil } from '../../../utils/StringUtil';
import { TableUtil } from '../../../utils/TableUtil';

type SearchHistoryEntry = {
  id: string;
  timestamp: string;
  description: string;
};

const tableData: SearchHistoryEntry[] = [
  {
    id: StringUtil.createUuid(),
    timestamp: '30-10-2023 11:25 AM',
    description: 'Demo search 1',
  },
  {
    id: StringUtil.createUuid(),
    timestamp: '01-10-2023 8:25 AM',
    description: 'Demo search 2',
  },
  {
    id: StringUtil.createUuid(),
    timestamp: '30-12-2023 14:25 AM',
    description: 'Demo search 2',
  },
];

export const SearchHistoryTable = () => {
  const [t] = useTranslation();

  const tableStore = useMemo(() => createTableStore<SearchHistoryEntry>({
    defaultSortByField: 'timestamp',
    defaultSortDirection: 'desc',
    idSelectorCallback: (entry) => entry.id,
    storageNamePostFix: 'HomePage-SearchHistory',
    storageVersion: 1,
  }), []);

  const tableColumns = useMemo<TableColumn<SearchHistoryEntry>[]>(() => [
    TableUtil.createTextColumn({ id: 'timestamp', name: t`Time` }),
    TableUtil.createTextColumn({ id: 'description', name: t`Description` }),
  ], [t]);

  const getRowName = useCallback((row: SearchHistoryEntry) => {
    return row.id;
  }, []);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: tableData });

  return (
    <TableStoreContextProvider store={tableStore}>
      <TableHeader
        header={t`Search history (demo data)`}
        headerComponent={'h6'}
        headerVariant={'h6'}
      />
      <Table
        getRowName={getRowName}
      />
    </TableStoreContextProvider>
  );
};
