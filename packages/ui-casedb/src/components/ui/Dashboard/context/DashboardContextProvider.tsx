import {
  use,
  useCallback,
  useMemo,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui';

import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../../models/caseDb';
import { UserProfileStoreContext } from '../../../../stores/userProfileStore/userProfileStoreContext';

import { DashboardContext } from './DashboardContext';

export type DashboardContextProviderProps = PropsWithChildren<{
  caseSet: CaseDbCaseSet;
}>;

export const DashboardContextProvider = ({ caseSet, children }: DashboardContextProviderProps) => {
  const userProfileStore = use(UserProfileStoreContext);
  const highlightSubject = useMemo<Subject<Highlighting>>(() => new Subject({
    caseIds: [],
    origin: null,
  }), []);
  const lineListRangeSubject = useMemo<Subject<LineListRangeSubjectValue>>(() => new Subject(), []);
  const linkedScrollSubject = useMemo<Subject<LinkedScrollSubjectValue>>(() => new Subject(), []);

  const reset = useCallback(() => {
    highlightSubject.next({
      caseIds: [],
      origin: null,
    });
    lineListRangeSubject.next(undefined);
    linkedScrollSubject.next(undefined);
  }, [highlightSubject, lineListRangeSubject, linkedScrollSubject]);

  const highlight = useCallback((highlighting: Highlighting) => {
    if (userProfileStore.getState().dashboardGeneralSettings.isHighlightingEnabled) {
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
    <DashboardContext value={contextValue}>
      {children}
    </DashboardContext>
  );
};
