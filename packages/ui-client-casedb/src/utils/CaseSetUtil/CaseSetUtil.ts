import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import { WINDOW_SERVICE_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';


export class CaseSetUtil {
  public static createCaseSetLink(caseSet: CaseDbCaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${container.resolve(WINDOW_SERVICE_TOKEN).window.location.origin}${path}`;
    }
    return path;
  }
}
