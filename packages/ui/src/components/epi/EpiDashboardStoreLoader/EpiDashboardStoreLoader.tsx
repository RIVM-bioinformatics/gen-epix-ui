import {
  type PropsWithChildren,
  useCallback,
  useState,
} from 'react';
import type {
  CaseSet,
  CompleteCaseType,
} from '@gen-epix/api-casedb';

import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiDashboardStoreLoaderContent } from './EpiDashboardStoreLoaderContent';

export type EpiDashboardStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseSet;
  readonly caseTypeId: string;
}>;

export const EpiDashboardStoreLoader = ({ caseSet, caseTypeId, children }: EpiDashboardStoreLoaderProps) => {
  const [completeCaseType, setCompleteCaseType] = useState<CompleteCaseType>(null);
  const onCompleteCaseTypeLoaded = useCallback((c: CompleteCaseType) => {
    setCompleteCaseType(c);
  }, []);

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
