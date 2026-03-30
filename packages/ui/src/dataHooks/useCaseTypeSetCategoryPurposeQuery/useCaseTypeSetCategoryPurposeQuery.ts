import { useMemo } from 'react';

import { CaseTypeSetCategoryPurpose } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const caseTypeSetCategoryPurposePresentationValues: Record<CaseTypeSetCategoryPurpose, string> = {
  [CaseTypeSetCategoryPurpose.CONTENT]: 'CONTENT',
  [CaseTypeSetCategoryPurpose.SECURITY]: 'SECURITY',
};

export const useCaseTypeSetCategoryPurposeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(caseTypeSetCategoryPurposePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      isEnabled: true,
      isFetching: false,
      isPending: false,
      options,
      error: null,
    } as UseOptions<string>;
  }, []);
};
