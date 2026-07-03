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

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { withEpiDashboardStore } from '../DashboardStoreLoader';
import { EventBusService } from '../../../classes/services/EventBusService';
import { DashboardEditCases } from '../DashboardEditCases';

import { DashboardContent } from './DashboardContent';
import { DashboardContextProvider } from './context/DashboardContextProvider';

type DashboardProps = {
  readonly caseSet?: CaseDbCaseSet;
};

export const Dashboard = withEpiDashboardStore(({ caseSet }: DashboardProps) => {
  const dashboardStore = use(DashboardStoreContext);
  const dataError = useStore(dashboardStore, (state) => state.dataError);
  const [casesToEdit, setCasesToEdit] = useState<CaseDbCase[] | null>(null);

  const onDashboardEditCasesClose = useCallback(() => {
    setCasesToEdit(null);
  }, []);

  useEffect(() => {
    const eventBus = EventBusService.getInstance();
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
    <DashboardContextProvider caseSet={caseSet}>
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
            <DashboardEditCases
              cases={casesToEdit}
              onClose={onDashboardEditCasesClose}
            />
          ) : (
            <DashboardContent caseSet={caseSet} />
          )}
        </ResponseHandler>
      </Box>
    </DashboardContextProvider>
  );
});
