import {
  use,
  useCallback,
  useMemo,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui';

import type {
  EpiLineListRangeSubjectValue,
  EpiLinkedScrollSubjectValue,
  Highlighting,
} from '../../../../models/epi';
import { UserProfileStoreContext } from '../../../../stores/userProfileStore/userProfileStoreContext';

import { EpiDashboardContext } from './EpiDashboardContext';

export type EpiDashboardContextProviderProps = PropsWithChildren<{
  caseSet: CaseDbCaseSet;
}>;

export const EpiDashboardContextProvider = ({ caseSet, children }: EpiDashboardContextProviderProps) => {
  const userProfileStore = use(UserProfileStoreContext);
  const highlightSubject = useMemo<Subject<Highlighting>>(() => new Subject({
    caseIds: [],
    origin: null,
  }), []);
  const lineListRangeSubject = useMemo<Subject<EpiLineListRangeSubjectValue>>(() => new Subject(), []);
  const linkedScrollSubject = useMemo<Subject<EpiLinkedScrollSubjectValue>>(() => new Subject(), []);

  const reset = useCallback(() => {
    highlightSubject.next({
      caseIds: [],
      origin: null,
    });
    lineListRangeSubject.next(undefined);
    linkedScrollSubject.next(undefined);
  }, [highlightSubject, lineListRangeSubject, linkedScrollSubject]);

  const highlight = useCallback((highlighting: Highlighting) => {
    if (userProfileStore.getState().epiDashboardGeneralSettings.isHighlightingEnabled) {
      highlightSubject.next(highlighting);
    }
  }, [highlightSubject, userProfileStore]);

  const contextValue = useMemo(() => {
    return {
      caseSet,
      highlight,
      highlightSubject,
      lineListRangeSubject,
      linkedScrollSubject,
      reset,
    };
  }, [caseSet, highlight, highlightSubject, lineListRangeSubject, linkedScrollSubject, reset]);
  return (
    <EpiDashboardContext value={contextValue}>
      {children}
    </EpiDashboardContext>
  );
};
