import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';


export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseDbCaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${container.resolve(WindowService).window.location.origin}${path}`;
    }
    return path;
  }
}
