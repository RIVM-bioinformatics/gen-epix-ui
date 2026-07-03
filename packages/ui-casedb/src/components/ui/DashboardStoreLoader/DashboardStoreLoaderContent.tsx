import type { PropsWithChildren } from 'react';
import {
  useEffect,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  CaseDbCaseSet,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import type { TableColumnDimension } from '@gen-epix/ui';
import {
  StringUtil,
  TableStoreContextProvider,
} from '@gen-epix/ui';

import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

type DashboardStoreLoaderContentProps = PropsWithChildren<{
  readonly caseSet: CaseDbCaseSet;
  readonly completeCaseType: CaseDbCompleteCaseType;
}>;

export const DashboardStoreLoaderContent = ({ caseSet, children, completeCaseType }: DashboardStoreLoaderContentProps) => {
  const dashBoardStore = useMemo(() => {
    const store = createDashboardStore({
      caseSetId: caseSet?.id,
      completeCaseType,
      idSelectorCallback: (row) => row.id,
      storageNamePostFix: `epiDashboardStoreLoader-${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createHash(completeCaseType.id)}`,
      storageVersion: 1,
    });
    return store;
  }, [caseSet, completeCaseType]);

  const tableColumnDimensions = useMemo<TableColumnDimension[]>(() => {
    const items: TableColumnDimension[] = [];
    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      const item: TableColumnDimension = {
        columnIds: completeCaseType.ordered_col_ids_by_dim[dim.id],
        id: dim.id,
        label: CaseTypeUtil.getDimLabel(completeCaseType, dim.id),
      };
      items.push(item);
    });
    return items;
  }, [completeCaseType]);

  const initialize = useStore(dashBoardStore, useShallow((state) => state.initialize));
  const setColumnDimensions = useStore(dashBoardStore, useShallow((state) => state.setColumnDimensions));

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
    <TableStoreContextProvider store={dashBoardStore}>
      <DashboardStoreContext value={dashBoardStore}>
        {children}
      </DashboardStoreContext>
    </TableStoreContextProvider>
  );
};
