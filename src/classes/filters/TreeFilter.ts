import { t } from 'i18next';

import type { FiltersInner } from '../../api';
import type { Filter } from '../../models/filter';
import { FilterAbstract } from '../abstracts/FilterAbstract';

export class TreeFilter extends FilterAbstract<string> implements Filter<string, string> {
  public initialFilterValue: string = null;
  public filterValue: string = null;

  public matchRowValue(): boolean {
    return true;
  }

  public getPresentationValue(): string {
    return t('Selected tree node ({{nodeName}})', { nodeName: this.filterValue });
  }

  public toBackendFilter(): FiltersInner {
    return undefined;
  }
}
