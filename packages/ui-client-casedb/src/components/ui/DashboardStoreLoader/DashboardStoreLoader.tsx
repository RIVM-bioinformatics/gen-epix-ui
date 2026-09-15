import {
  useCallback,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type {
  CaseDbCaseSet,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';

import { CompletCaseTypeLoader } from '../CompletCaseTypeLoader';

import { DashboardStoreLoaderContent } from './DashboardStoreLoaderContent';

export type DashboardStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseDbCaseSet;
  readonly caseTypeId: string;
}>;

export const DashboardStoreLoader = ({ caseSet, caseTypeId, children }: DashboardStoreLoaderProps) => {
  const [completeCaseType, setCompleteCaseType] = useState<CaseDbCompleteCaseType>(null);
  const onCompleteCaseTypeLoaded = useCallback((c: CaseDbCompleteCaseType) => {
    setCompleteCaseType(c);
  }, []);

  return (
    <CompletCaseTypeLoader
      caseTypeId={caseTypeId}
      onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
    >
      <DashboardStoreLoaderContent
        caseSet={caseSet}
        completeCaseType={completeCaseType}
      >
        {completeCaseType && children}
      </DashboardStoreLoaderContent>
    </CompletCaseTypeLoader>
  );
};
