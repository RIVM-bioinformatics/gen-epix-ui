import { useMemo } from 'react';
import { CaseDbDimType } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const dimTypePresentationValues: Record<CaseDbDimType, string> = {
  [CaseDbDimType.GEO]: 'GEO',
  [CaseDbDimType.IDENTIFIER]: 'IDENTIFIER',
  [CaseDbDimType.NUMBER]: 'NUMBER',
  [CaseDbDimType.ORGANIZATION]: 'ORGANIZATION',
  [CaseDbDimType.OTHER]: 'OTHER',
  [CaseDbDimType.TEXT]: 'TEXT',
  [CaseDbDimType.TIME]: 'TIME',
};

export const useDimTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(dimTypePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null as UseOptions<string>,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    };
  }, []);
};
