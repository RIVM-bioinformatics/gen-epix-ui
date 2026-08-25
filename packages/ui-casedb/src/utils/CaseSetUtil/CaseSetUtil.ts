import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';


export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseDbCaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowService.getInstance().window.location.origin}${path}`;
    }
    return path;
  }
}
