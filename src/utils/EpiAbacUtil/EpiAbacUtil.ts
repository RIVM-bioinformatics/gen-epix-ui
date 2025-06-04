import type { CaseTypeAccessAbac } from '../../api';

export class EpiAbacUtil {
  public static createEffectieveColumnAccessRights(
    caseTypeAccessAbacs: CaseTypeAccessAbac[],
  ): Map<string, { read: boolean; write: boolean }> {
    const effectiveColumnAccessRights = new Map<string, { read: boolean; write: boolean }>();
    caseTypeAccessAbacs.forEach((caseTypeAccessAbac) => {
      caseTypeAccessAbac.read_case_type_col_ids.forEach(colId => {
        const currentRights = effectiveColumnAccessRights.get(colId) ?? { read: false, write: false };
        effectiveColumnAccessRights.set(colId, { ...currentRights, read: true });
      });
      caseTypeAccessAbac.write_case_type_col_ids.forEach(colId => {
        const currentRights = effectiveColumnAccessRights.get(colId) ?? { read: false, write: false };
        effectiveColumnAccessRights.set(colId, { ...currentRights, write: true });
      });
    });

    return effectiveColumnAccessRights;
  }
}
