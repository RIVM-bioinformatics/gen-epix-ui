import { useMemo } from 'react';
import { CaseDbCaseTypeSetCategoryPurpose } from '@gen-epix/api-casedb';
import type {
  OptionBase,
  UseOptions,
} from '@gen-epix/ui';

export const caseTypeSetCategoryPurposePresentationValues: Record<CaseDbCaseTypeSetCategoryPurpose, string> = {
  [CaseDbCaseTypeSetCategoryPurpose.CONTENT]: 'CONTENT',
  [CaseDbCaseTypeSetCategoryPurpose.SECURITY]: 'SECURITY',
};

export const useCaseTypeSetCategoryPurposeOptionsQuery = (): UseOptions<string> => {
  return useMemo<UseOptions<string>>(() => {
    const options: OptionBase<string>[] = Object.entries(caseTypeSetCategoryPurposePresentationValues).map(([value, label]) => ({ label, value }));
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
