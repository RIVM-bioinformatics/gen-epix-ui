import type { CaseDbCaseSet } from '@gen-epix/api-casedb';

import { StringUtil } from '../StringUtil';
import { WindowManager } from '../../classes/managers/WindowManager';

export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseDbCaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }
}
