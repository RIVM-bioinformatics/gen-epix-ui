import { useMemo } from 'react';
import { CaseDbDimType } from '@gen-epix/api-casedb';
import type {
  OptionBase,
  UseOptions,
} from '@gen-epix/ui';


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
  return useMemo<UseOptions<string>>(() => {
    const options: OptionBase<string>[] = Object.entries(dimTypePresentationValues).map(([value, label]) => ({ label, value }));
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
