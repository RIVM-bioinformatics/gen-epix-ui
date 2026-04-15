import { t } from 'i18next';
import type { CaseDbFiltersInner } from '@gen-epix/api-casedb';

import type { Filter } from '../../models/filter';
import { FilterAbstract } from '../abstracts/FilterAbstract';

export class TreeFilter extends FilterAbstract<string> implements Filter<string, string> {
  public filterValue: string = null;
  public initialFilterValue: string = null;

  public getPresentationValue(): string {
    return t('Selected tree node ({{nodeName}})', { nodeName: this.filterValue });
  }

  public matchRowValue(): boolean {
    return true;
  }

  public toBackendFilter(): CaseDbFiltersInner {
    return undefined;
  }
}
