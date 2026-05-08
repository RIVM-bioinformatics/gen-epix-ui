import { t } from 'i18next';
import type { CommonDbFiltersInner } from '@gen-epix/api-commondb';
import type { Filter } from '@gen-epix/ui';
import { FilterAbstract } from '@gen-epix/ui';


export class SelectionFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public filterValue: string[] = [];
  public initialFilterValue: string[] = [];
  public showInSidebar = false;

  public getPresentationValue(): string {
    return t('{{numCases}} case(s)', { numCases: this.filterValue.length });
  }

  public matchRowValue(_rowValue: unknown): boolean {
    // ! FIXME
    return !this.filterValue.length;
  }

  public toBackendFilter(): CommonDbFiltersInner {
    return undefined;
  }
}
