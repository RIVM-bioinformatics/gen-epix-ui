import type { CaseDbCase } from '@gen-epix/api-casedb';
import sumBy from 'lodash/sumBy';


export class EpiDashboardUtil {
  public static getCaseCount(cases: CaseDbCase[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getSelectedRows(cases: CaseDbCase[], selectedIds: string[]): CaseDbCase[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }


}
