import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  GetTableCellRowComparatorProps,
  GetTableCellValueProps,
  TableColumnText,
} from '@gen-epix/ui';

import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import { CaseUtil } from '../CaseUtil';

export class CaseDbTableUtil {
  // Cell value getters
  public static createCaseTypeCellRowComperator({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>, CaseDbCompleteCaseType>): (a: CaseDbCase, b: CaseDbCase) => number {
    return (a: CaseDbCase, b: CaseDbCase) => {
      const aValue = CaseUtil.getRowValue(a.content, column.columnContext, dataContext);
      const bValue = CaseUtil.getRowValue(b.content, column.columnContext, dataContext);
      const col = column.columnContext;
      const refCol = dataContext.ref_cols[col.ref_col_id];

      const directionMultiplier = direction === 'asc' ? 1 : -1;

      if (aValue.raw === bValue.raw) {
        return 0;
      }
      if (aValue.isMissing) {
        return 1;
      }
      if (bValue.isMissing) {
        return -1;
      }

      if (refCol.col_type === CaseDbColType.ORDINAL) {
        const conceptSetConceptIds = EpiDataManager.getInstance().data.conceptsIdsBySetId[refCol.concept_set_id];
        return (conceptSetConceptIds.indexOf(aValue.raw) - conceptSetConceptIds.indexOf(bValue.raw)) * directionMultiplier;
      }

      if (([CaseDbColType.DECIMAL_0, CaseDbColType.DECIMAL_1, CaseDbColType.DECIMAL_2, CaseDbColType.DECIMAL_3, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_5, CaseDbColType.DECIMAL_6] as CaseDbColType[]).includes(refCol.col_type)) {
        return (+aValue.raw - +bValue.raw) * directionMultiplier;
      }

      return aValue.short.localeCompare(bValue.short) * directionMultiplier;
    };
  }

  public static getTableCaseTypeCellValue<TRowData>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData, CaseDbCompleteCaseType, CaseDbCol>, CaseDbCompleteCaseType>): string {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    return CaseUtil.getRowValue((row as CaseDbCase).content, column.columnContext, dataContext).raw;
  }
}
