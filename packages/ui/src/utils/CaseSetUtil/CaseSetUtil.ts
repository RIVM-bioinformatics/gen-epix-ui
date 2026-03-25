import { StringUtil } from '../StringUtil';
import type { CaseSet } from '../../api';
import { WindowManager } from '../../classes/managers/WindowManager';

export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }
}
