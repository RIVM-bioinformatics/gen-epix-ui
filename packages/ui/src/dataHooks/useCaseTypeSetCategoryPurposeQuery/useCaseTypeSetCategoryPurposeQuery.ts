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
    const options: OptionBase<string>[] = Object.entries(caseTypeSetCategoryPurposePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    } as UseOptions<string>;
  }, []);
};
