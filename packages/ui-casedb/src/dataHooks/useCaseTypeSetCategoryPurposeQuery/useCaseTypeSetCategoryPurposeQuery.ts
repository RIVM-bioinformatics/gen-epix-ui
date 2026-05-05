import { useMemo } from 'react';
import { CaseDbCaseTypeSetCategoryPurpose } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const caseTypeSetCategoryPurposePresentationValues: Record<CaseDbCaseTypeSetCategoryPurpose, string> = {
  [CaseDbCaseTypeSetCategoryPurpose.CONTENT]: 'CONTENT',
  [CaseDbCaseTypeSetCategoryPurpose.SECURITY]: 'SECURITY',
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
