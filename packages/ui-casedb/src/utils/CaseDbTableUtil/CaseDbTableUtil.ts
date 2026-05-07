import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  GetTableCellRowComparatorProps,
  GetTableCellValueProps,
  TableColumnText,
} from '@gen-epix/ui';

import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import type { CaseTypeRowValue } from '../../models/epi';
import { CaseUtil } from '../CaseUtil';

export class CaseDbTableUtil {
  // Cell value getters
  public static createCaseTypeCellRowComperator<TRowData>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData, CaseDbCompleteCaseType>, CaseDbCompleteCaseType>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = CaseDbTableUtil.getTableCaseTypeCellValue({ column, dataContext, row: a, rowIndex: 0 });
      const bValue = CaseDbTableUtil.getTableCaseTypeCellValue({ column, dataContext, row: b, rowIndex: 0 });
      const refCol = column.completeCaseType.ref_cols[column.col.ref_col_id];

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

  public static getTableCaseTypeCellDisplayValue<TRowData>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData, CaseDbCompleteCaseType>, CaseDbCompleteCaseType>): string {
    const value = CaseDbTableUtil.getTableCaseTypeCellValue({ column, dataContext, row, rowIndex });
    return value.short;
  }

  public static getTableCaseTypeCellValue<TRowData>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData, CaseDbCompleteCaseType>, CaseDbCompleteCaseType>): CaseTypeRowValue {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    return CaseUtil.getRowValue((row as CaseDbCase).content, column.col, column.completeCaseType);
  }
}
