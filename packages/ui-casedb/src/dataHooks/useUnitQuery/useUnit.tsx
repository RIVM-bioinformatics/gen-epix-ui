import { useMemo } from 'react';
import { CaseDbUnit } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui/models/dataHooks';
import type { OptionBase } from '@gen-epix/ui-form/models/form';


export const unitValues: Record<CaseDbUnit, string> = {
  [CaseDbUnit.BASE_PAIR]: 'BASE_PAIR',
  [CaseDbUnit.DAY]: 'DAY',
  [CaseDbUnit.DOSE]: 'DOSE',
  [CaseDbUnit.HOUR]: 'HOUR',
  [CaseDbUnit.MINUTE]: 'MINUTE',
  [CaseDbUnit.MONTH]: 'MONTH',
  [CaseDbUnit.OTHER]: 'OTHER',
  [CaseDbUnit.QUARTER]: 'QUARTER',
  [CaseDbUnit.SECOND]: 'SECOND',
  [CaseDbUnit.WEEK]: 'WEEK',
  [CaseDbUnit.YEAR]: 'YEAR',
};

export const useUnitOptionsQuery = (): UseOptions<string> => {
  return useMemo<UseOptions<string>>(() => {
    const options: OptionBase<string>[] = Object.entries(unitValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    };
  }, []);
};
