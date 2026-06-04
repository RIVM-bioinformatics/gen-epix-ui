import type { CaseDbCase } from '@gen-epix/api-casedb';
import { Button } from '@mui/material';
import { Box } from '@mui/system';
import noop from 'lodash/noop';
import {
  use,
  useEffect,
  useMemo,
} from 'react';
import { useStore } from 'zustand';

import {
  createEpiUploadStore,
  EpiUploadStoreContext,
  STEP_ORDER_BULK_EDIT,
} from '../../../stores/epiUploadStore';
import { EpiUpload } from '../EpiUpload';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';

export type EpiDashboardEditCasesProps = {
  cases: CaseDbCase[];
  onClose: () => void;
};

export const EpiDashboardEditCases = ({ cases, onClose }: EpiDashboardEditCasesProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);

  const casesForVerificationFromSourceData = useMemo(() => {
    return cases.map((caseItem) => ({
      ...caseItem,
      generatedId: caseItem.id,
    }));
  }, [cases]);

  const epiUploadStore = useMemo(() => createEpiUploadStore({
    casesForVerificationFromSourceData,
    completeCaseType,
    stepOrder: STEP_ORDER_BULK_EDIT,
  }), [casesForVerificationFromSourceData, completeCaseType]);

  useEffect(() => {
    return () => {
      epiUploadStore.getState().destroy().catch(noop);
    };
  }, [epiUploadStore]);

  return (
    <Box>
      {'Editing cases...'}
      <Box>
        <EpiUploadStoreContext value={epiUploadStore}>
          <EpiUpload />
        </EpiUploadStoreContext>
      </Box>
      <Box>
        <Button onClick={onClose}>
          {'Close'}
        </Button>
      </Box>
    </Box>
  );
};
