import {
  type PropsWithChildren,
  useCallback,
  useState,
} from 'react';
import type {
  CaseDbCaseSet,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';

import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiDashboardStoreLoaderContent } from './EpiDashboardStoreLoaderContent';

export type EpiDashboardStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseDbCaseSet;
  readonly caseTypeId: string;
}>;

export const EpiDashboardStoreLoader = ({ caseSet, caseTypeId, children }: EpiDashboardStoreLoaderProps) => {
  const [completeCaseType, setCompleteCaseType] = useState<CaseDbCompleteCaseType>(null);
  const onCompleteCaseTypeLoaded = useCallback((c: CaseDbCompleteCaseType) => {
    setCompleteCaseType(c);
  }, []);

  console.log('EpiDashboardStoreLoader render', { caseSet, caseTypeId, completeCaseType });

  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={caseTypeId}
      onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
    >
      <EpiDashboardStoreLoaderContent
        caseSet={caseSet}
        completeCaseType={completeCaseType}
      >
        {completeCaseType && children}
      </EpiDashboardStoreLoaderContent>
    </EpiCompletCaseTypeLoader>
  );
};
