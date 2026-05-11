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
  createEpiDashboardStore,
  EpiDashboardStoreContext,
} from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

type EpiDashboardStoreLoaderContentProps = PropsWithChildren<{
  readonly caseSet: CaseDbCaseSet;
  readonly completeCaseType: CaseDbCompleteCaseType;
}>;

export const EpiDashboardStoreLoaderContent = ({ caseSet, children, completeCaseType }: EpiDashboardStoreLoaderContentProps) => {
  const epiDashBoardStore = useMemo(() => {
    const store = createEpiDashboardStore({
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
      <EpiDashboardStoreContext value={epiDashBoardStore}>
        {children}
      </EpiDashboardStoreContext>
    </TableStoreContextProvider>
  );
};
