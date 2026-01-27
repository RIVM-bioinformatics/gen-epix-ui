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
  createEpiStore,
  EpiStoreContext,
} from '../../../stores/epiStore';
import { TableStoreContextProvider } from '../../../stores/tableStore';
import { StringUtil } from '../../../utils/StringUtil';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

type EpiStoreInitializerProps = PropsWithChildren<{
  readonly completeCaseType: CompleteCaseType;
  readonly caseSet: CaseSet;
}>;

export const EpiStoreLoaderContent = ({ completeCaseType, caseSet, children }: EpiStoreInitializerProps) => {
  const epiStore = useMemo(() => createEpiStore({
    idSelectorCallback: (row) => row.id,
    caseSetId: caseSet?.id,
    completeCaseType,
    storageNamePostFix: `EpiStoreLoader-${StringUtil.createSlug(completeCaseType.name)}-${StringUtil.createHash(completeCaseType.id)}`,
    storageVersion: 1,
  }), [caseSet, completeCaseType]);

  const tableColumnDimensions = useMemo<TableColumnDimension[]>(() => {
    const items: TableColumnDimension[] = [];
    completeCaseType.ordered_case_type_dim_ids.map(x => completeCaseType.case_type_dims[x]).forEach((caseTypeDim) => {
      const item: TableColumnDimension = {
        label: CaseTypeUtil.getDimensionLabel(completeCaseType, caseTypeDim.id),
        id: caseTypeDim.id,
        columnIds: completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDim.id],
      };
      items.push(item);
    });
    return items;
  }, [completeCaseType]);

  const initialize = useStore(epiStore, useShallow((state) => state.initialize));
  const setColumnDimensions = useStore(epiStore, useShallow((state) => state.setColumnDimensions));

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
    <TableStoreContextProvider store={epiStore}>
      <EpiStoreContext.Provider value={epiStore}>
        {children}
      </EpiStoreContext.Provider>
    </TableStoreContextProvider>
  );
};
