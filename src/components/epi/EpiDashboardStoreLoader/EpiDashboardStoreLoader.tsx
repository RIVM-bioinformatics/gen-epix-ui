import {
  useState,
  type PropsWithChildren,
} from 'react';

import type {
  CaseSet,
  CompleteCaseType,
} from '../../../api';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiDashboardStoreLoaderContent } from './EpiDashboardStoreLoaderContent';

export type EpiDashboardStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseSet;
  readonly caseTypeId: string;
}>;

export const EpiDashboardStoreLoader = ({ caseTypeId, caseSet, children }: EpiDashboardStoreLoaderProps) => {
  const [completeCaseType, setCompleteCaseType] = useState<CompleteCaseType>(null);
  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={caseTypeId}
      onCompleteCaseTypeLoaded={setCompleteCaseType}
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
