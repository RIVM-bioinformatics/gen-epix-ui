import uniq from 'lodash/uniq';
import type {
  CaseDbCaseType,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';

import { StringUtil } from '../StringUtil';
import { WindowManager } from '../../classes/managers/WindowManager';

export const SELECTION_FILTER_GROUP = 'selection';
export const TREE_FILTER_GROUP = 'tree';

export class CaseTypeUtil {
  public static createCaseTypeLink(caseType: CaseDbCaseType | CaseDbCompleteCaseType, full?: boolean): string {
    const path = `/cases/${StringUtil.createSlug(caseType.name)}/${caseType.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }

  /**
   * Find paired FWD/REV columns in the same dimension.
   * @param completeCaseType The complete case type object.
   * @returns An array of paired FWD/REV columns.
   */
  public static findPairedReadsCols(completeCaseType: CaseDbCompleteCaseType): { fwd: CaseDbCol; rev: CaseDbCol }[] {
    const pairs: { fwd: CaseDbCol; rev: CaseDbCol }[] = [];

    completeCaseType.ordered_dim_ids.forEach(dimId => {
      const cols = completeCaseType.ordered_col_ids_by_dim[dimId].map(x => completeCaseType.cols[x]);
      if (!cols) {
        return;
      }
      const readsColumns = cols.filter(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        return refCol?.col_type === CaseDbColType.GENETIC_READS;
      });

      if (readsColumns.length === 2) {
        pairs.push({ fwd: readsColumns[0], rev: readsColumns[1] });
      }

    });

    return pairs;
  }

  /**
   * Find a unique column by its column ID or column ID.
   * @param completeCaseType The complete case type object.
   * @param id The ID of the column or column.
   * @returns The unique column if found, otherwise null.
   */
  public static findUniqueColByColIdRefOrColId(completeCaseType: CaseDbCompleteCaseType, id: string): CaseDbCol {
    const colId = Object.values(completeCaseType.cols).find(col => col.ref_col_id === id);
    if (colId) {
      return colId;
    }
    const colIds = Object.values(completeCaseType.ref_cols).filter(ref_col => ref_col.id === id);
    if (colIds.length !== 1) {
      return null;
    }
    const cols = Object.values(completeCaseType.cols).filter(col => col.ref_col_id === colIds[0].id);
    if (cols.length !== 1) {
      return null;
    }
    return cols[0];
  }

  public static getCols(completeCaseType: CaseDbCompleteCaseType, dimId?: string): CaseDbCol[] {
    if (!dimId) {
      return Object.values(completeCaseType.cols);
    }
    return completeCaseType.ordered_col_ids_by_dim[dimId].map(id => completeCaseType.cols[id]);
  }

  /**
   * Get columns by their column type.
   * @param completeCaseType The complete case type object.
   * @param colType The column type to filter by.
   * @returns An array of columns matching the specified column type.
   */
  public static getColsByType(completeCaseType: CaseDbCompleteCaseType, colType: CaseDbColType[]): CaseDbCol[] {
    return Object.values(completeCaseType.cols).filter(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      return colType.includes(refCol?.col_type);
    });
  }

  public static getDimLabel(completeCaseType: CaseDbCompleteCaseType, dimId: string): string {
    const dim = completeCaseType.dims[dimId];
    return dim.code;
  }

  public static getDims(completeCaseType: CaseDbCompleteCaseType, dimTypes?: CaseDbDimType[]): CaseDbDim[] {
    const dims = Object.values(completeCaseType.ordered_dim_ids).map(x => completeCaseType.dims[x]);
    if (!dimTypes?.length) {
      return dims;
    }
    return dims.filter(dim => {
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      return dimTypes.includes(refDim.dim_type);
    });
  }

  public static getInitialVisibleColIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const visibleColumnIds: string[] = [];

    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      const refDims = completeCaseType.ref_dims[dim.ref_dim_id];

      const cols = completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]);
      const refCols = cols.map(col => completeCaseType.ref_cols[col.ref_col_id]);

      if (refDims.dim_type === CaseDbDimType.GEO) {
        visibleColumnIds.push(CaseTypeUtil.getPreferredGEOCol(cols).id);
      } else if (refDims.dim_type === CaseDbDimType.TIME || refDims.dim_type === CaseDbDimType.NUMBER || CaseTypeUtil.isGeneticDistanceDim(refDims, refCols)) {
        visibleColumnIds.push(CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType).id);
      } else {
        visibleColumnIds.push(...cols.filter(cc => {
          const refCol = completeCaseType.ref_cols[cc.ref_col_id];
          const hiddenColTypes: CaseDbColType[] = [CaseDbColType.GENETIC_READS, CaseDbColType.GENETIC_SEQUENCE];
          return !hiddenColTypes.includes(refCol.col_type);
        }).map(c => c.id));
      }
    });

    return visibleColumnIds;
  }


  public static getPreferredColInDimHavingHighestRank(cols: CaseDbCol[], completeCaseType: CaseDbCompleteCaseType): CaseDbCol {
    return cols.find(col => completeCaseType.ref_cols[col.ref_col_id].rank === 1) ?? cols?.[0];
  }


  public static getPreferredGEOCol(cols: CaseDbCol[]): CaseDbCol {
    return cols[Math.min(cols.length - 1, Math.floor((cols.length - 1) / 2))];
  }


  public static getWritableColIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const writableColIds: string[] = [];
    Object.values(completeCaseType.case_type_access_abacs).forEach((abac) => {
      writableColIds.push(...abac.write_col_ids);
    });
    return uniq(writableColIds);
  }

  public static getWritableImportExportColIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const writableColIds = CaseTypeUtil.getWritableColIds(completeCaseType);
    return Object.keys(completeCaseType.cols).filter(colId => {
      if (!writableColIds.includes(colId)) {
        return false;
      }
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (([CaseDbColType.GENETIC_DISTANCE, CaseDbColType.GENETIC_PROFILE, CaseDbColType.GENETIC_READS, CaseDbColType.GENETIC_SEQUENCE] as CaseDbColType[]).includes(refCol.col_type)) {
        return false;
      }
      return true;
    });
  }

  public static isGeneticDistanceDim(refDim: CaseDbRefDim, refCols: CaseDbRefCol[]): boolean {
    return refDim.dim_type === CaseDbDimType.OTHER && refCols.find(refCol => refCol.col_type === CaseDbColType.GENETIC_DISTANCE) !== undefined;
  }

}
