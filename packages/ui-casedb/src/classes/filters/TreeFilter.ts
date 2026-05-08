import { t } from 'i18next';
import type { CommonDbFiltersInner } from '@gen-epix/api-commondb';
import type { Filter } from '@gen-epix/ui';
import { FilterAbstract } from '@gen-epix/ui';

export class TreeFilter extends FilterAbstract<string> implements Filter<string, string> {
  public filterValue: string = null;
  public initialFilterValue: string = null;
  public showInSidebar = false;

  public getPresentationValue(): string {
    return t('Selected tree node ({{nodeName}})', { nodeName: this.filterValue });
  }

  public matchRowValue(): boolean {
    return true;
  }

  public toBackendFilter(): CommonDbFiltersInner {
    return undefined;
  }
}
