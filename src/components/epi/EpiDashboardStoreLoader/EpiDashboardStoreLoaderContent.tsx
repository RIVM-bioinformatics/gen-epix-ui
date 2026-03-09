import type { PropsWithChildren } from 'react';
import {
  useMemo,
  useEffect,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type {
  CompleteCaseType,
  CaseSet,
} from '../../../api';
import type { TableColumnDimension } from '../../../models/table';
import {
  createEpiDashboardStore,
  EpiDashboardStoreContext,
} from '../../../stores/epiDashboardStore';
import { TableStoreContextProvider } from '../../../stores/tableStore';
import { StringUtil } from '../../../utils/StringUtil';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

type EpiDashboardStoreLoaderContentProps = PropsWithChildren<{
  readonly completeCaseType: CompleteCaseType;
  readonly caseSet: CaseSet;
}>;

export const EpiDashboardStoreLoaderContent = ({ completeCaseType, caseSet, children }: EpiDashboardStoreLoaderContentProps) => {
  const epiDashBoardStore = useMemo(() => {
    const store = createEpiDashboardStore({
      idSelectorCallback: (row) => row.id,
      caseSetId: caseSet?.id,
      completeCaseType,
      storageNamePostFix: `epiDashboardStoreLoader-${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createHash(completeCaseType.id)}`,
      storageVersion: 1,
    });
    return store;
  }, [caseSet, completeCaseType]);

  const tableColumnDimensions = useMemo<TableColumnDimension[]>(() => {
    const items: TableColumnDimension[] = [];
    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      const item: TableColumnDimension = {
        label: CaseTypeUtil.getDimLabel(completeCaseType, dim.id),
        id: dim.id,
        columnIds: completeCaseType.ordered_col_ids_by_dim[dim.id],
      };
      items.push(item);
    });
    return items;
  }, [completeCaseType]);

  const initialize = useStore(epiDashBoardStore, useShallow((state) => state.initialize));
  const setColumnDimensions = useStore(epiDashBoardStore, useShallow((state) => state.setColumnDimensions));

  useEffect(() => {
    const abortController = new AbortController();
    setColumnDimensions(tableColumnDimensions);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initialize(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [initialize, setColumnDimensions, tableColumnDimensions]);

  return (
    <TableStoreContextProvider store={epiDashBoardStore}>
      <EpiDashboardStoreContext.Provider value={epiDashBoardStore}>
        {children}
      </EpiDashboardStoreContext.Provider>
    </TableStoreContextProvider>
  );
};
