import type { CaseDbCaseTypeAccessAbac } from '@gen-epix/api-casedb';

export class AbacUtil {
  public static createEffectieveColumnAccessRights(
    caseTypeAccessAbacs: CaseDbCaseTypeAccessAbac[],
  ): Map<string, { read: boolean; write: boolean }> {
    const effectiveColumnAccessRights = new Map<string, { read: boolean; write: boolean }>();
    caseTypeAccessAbacs.forEach((caseTypeAccessAbac) => {
      caseTypeAccessAbac.read_col_ids.forEach(colId => {
        const currentRights = effectiveColumnAccessRights.get(colId) ?? { read: false, write: false };
        effectiveColumnAccessRights.set(colId, { ...currentRights, read: true });
      });
      caseTypeAccessAbac.write_col_ids.forEach(colId => {
        const currentRights = effectiveColumnAccessRights.get(colId) ?? { read: false, write: false };
        effectiveColumnAccessRights.set(colId, { ...currentRights, write: true });
      });
    });

    return effectiveColumnAccessRights;
  }
}
