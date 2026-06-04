import type { CaseDbCase } from '@gen-epix/api-casedb';
import noop from 'lodash/noop';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

import {
  createEpiUploadStore,
  EpiUploadStoreContext,
  STEP_ORDER_BULK_EDIT,
} from '../../../stores/epiUploadStore';
import { EpiUpload } from '../EpiUpload';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import type { CaseForUploadWithGeneratedId } from '../../../models/epi';

export type EpiDashboardEditCasesProps = {
  cases: CaseDbCase[];
  onClose: () => void;
};

export const EpiDashboardEditCases = ({ cases, onClose }: EpiDashboardEditCasesProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const fetchData = useStore(epiDashboardStore, (state) => state.fetchData);
  const { t } = useTranslation();

  const casesForVerificationFromSourceData = useMemo<CaseForUploadWithGeneratedId[]>(() => {
    return cases.map<CaseForUploadWithGeneratedId>((caseItem) => ({
      case: {
        ...caseItem,
      },
      generatedId: caseItem.id,
      id: caseItem.id,
    } satisfies CaseForUploadWithGeneratedId));
  }, [cases]);

  const onUploadComplete = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const epiUploadStore = useMemo(() => createEpiUploadStore({
    casesForVerificationFromSourceData,
    completeCaseType,
    goBackFromFirstStepCallback: onClose,
    goBackFromFirstStepLabel: t`Back to line list`,
    onUploadComplete,
    stepOrder: STEP_ORDER_BULK_EDIT,
    uploadCompleteButtonCallback: onClose,
    uploadCompleteButtonLabel: t`Back to line list`,
  }), [casesForVerificationFromSourceData, completeCaseType, onClose, onUploadComplete, t]);

  useEffect(() => {
    return () => {
      epiUploadStore.getState().destroy().catch(noop);
    };
  }, [epiUploadStore]);

  return (
    <EpiUploadStoreContext value={epiUploadStore}>
      <EpiUpload />
    </EpiUploadStoreContext>
  );
};
