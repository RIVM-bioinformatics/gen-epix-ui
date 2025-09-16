import {
  useState,
  type PropsWithChildren,
} from 'react';

import type {
  CaseSet,
  CompleteCaseType,
} from '../../../api';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiStoreLoaderContent } from './EpiStoreLoaderContent';

export type EpiStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseSet;
  readonly caseTypeId: string;
}>;

export const EpiStoreLoader = ({ caseTypeId, caseSet, children }: EpiStoreLoaderProps) => {
  const [completeCaseType, setCompleteCaseType] = useState<CompleteCaseType | null>(null);
  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={caseTypeId}
      onCompleteCaseTypeLoaded={setCompleteCaseType}
    >
      <EpiStoreLoaderContent
        caseSet={caseSet}
        completeCaseType={completeCaseType}
      >
        {completeCaseType && children}
      </EpiStoreLoaderContent>
    </EpiCompletCaseTypeLoader>
  );
};
