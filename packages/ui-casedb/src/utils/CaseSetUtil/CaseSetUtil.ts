import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import {
  StringUtil,
  WindowService,
} from '@gen-epix/ui';


export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseDbCaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowService.getInstance().window.location.origin}${path}`;
    }
    return path;
  }
}
