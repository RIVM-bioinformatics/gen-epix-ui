import sumBy from 'lodash/sumBy';

import type { Case } from '../../api';


export class EpiLineListUtil {
  public static getCaseCount(cases: Case[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getSelectedRows(cases: Case[], selectedIds: string[]): Case[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }
}
