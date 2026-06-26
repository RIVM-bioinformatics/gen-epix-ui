import type {
  CaseDbCase,
  CaseDbCaseSet,
} from '@gen-epix/api-casedb';
import { ResponseHandler } from '@gen-epix/ui';
import { Box } from '@mui/system';
import {
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useStore } from 'zustand';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { withEpiDashboardStore } from '../EpiDashboardStoreLoader';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiDashboardEditCases } from '../EpiDashboardEditCases';

import { EpiDashboardContent } from './EpiDashboardContent';
import { EpiDashboardContextProvider } from './context/EpiDashboardContextProvider';

type EpiDashboardProps = {
  readonly caseSet?: CaseDbCaseSet;
};

export const EpiDashboard = withEpiDashboardStore(({ caseSet }: EpiDashboardProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const dataError = useStore(epiDashboardStore, (state) => state.dataError);
  const [casesToEdit, setCasesToEdit] = useState<CaseDbCase[] | null>(null);

  const onEpiDashboardEditCasesClose = useCallback(() => {
    setCasesToEdit(null);
  }, []);

  useEffect(() => {
    const eventBus = EpiEventBusManager.getInstance();
    const removers = [
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openEditCases', (cases: CaseDbCase[]) => {
        setCasesToEdit(cases);
      }),
    ];
    return () => {
      removers.forEach(callbackfn => callbackfn());
    };
  }, []);

  return (
    <EpiDashboardContextProvider caseSet={caseSet}>
      <Box
        sx={{
          height: '100%',
          position: 'relative',
          width: '100%',
        }}
      >
        <ResponseHandler
          error={dataError}
          isLoading={false}
        >
          {casesToEdit ? (
            <EpiDashboardEditCases
              cases={casesToEdit}
              onClose={onEpiDashboardEditCasesClose}
            />
          ) : (
            <EpiDashboardContent caseSet={caseSet} />
          )}
        </ResponseHandler>
      </Box>
    </EpiDashboardContextProvider>
  );
});
