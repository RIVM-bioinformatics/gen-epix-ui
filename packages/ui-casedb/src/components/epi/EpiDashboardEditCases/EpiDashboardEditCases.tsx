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
  ResponseHandler,
  useArray,
} from '@gen-epix/ui';

import {
  createEpiUploadStore,
  EpiUploadStoreContext,
  STEP_ORDER_BULK_EDIT,
} from '../../../stores/epiUploadStore';
import { EpiUpload } from '../EpiUpload';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import type { CaseForUploadWithGeneratedId } from '../../../models/epi';
import { useCaseRightsQuery } from '../../../dataHooks/useCaseRightsQuery';

export type EpiDashboardEditCasesProps = {
  cases: CaseDbCase[];
  onClose: () => void;
};

export const EpiDashboardEditCases = ({ cases, onClose }: EpiDashboardEditCasesProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const fetchData = useStore(epiDashboardStore, (state) => state.fetchData);
  const { t } = useTranslation();

  const caseRightsQuery = useCaseRightsQuery(cases.map(c => c.id), completeCaseType.id, cases.length > 0);

  const loadables = useArray([caseRightsQuery]);

  const caseRightsColMap = useMemo(() => {
    const map: { [colId: string]: string[] } = {};
    completeCaseType.ordered_col_ids.forEach(colId => {
      map[colId] = [];
    });

    if (!caseRightsQuery.data) {
      // build from completeCaseType (allow all cols) if caseRights not provided
      completeCaseType.ordered_col_ids.forEach(colId => {
        cases.forEach((caseItem) => {
          map[colId].push(caseItem.id);
        });
      });
    } else {
      // build from caseRights if provided
      caseRightsQuery.data.forEach((caseRight) => {
        if (caseRight.is_full_access) {
          completeCaseType.ordered_col_ids.forEach(colId => {
            map[colId].push(caseRight.case_id);
          });
        } else {
          caseRight.write_col_ids.forEach(colId => {
            if (!map[colId].includes(caseRight.case_id)) {
              map[colId].push(caseRight.case_id);
            }
          });
        }
      });
    }
    return map;
  }, [caseRightsQuery.data, cases, completeCaseType]);

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
    caseRightsColMap,
    casesForVerificationFromSourceData,
    completeCaseType,
    goBackFromFirstStepCallback: onClose,
    goBackFromFirstStepLabel: t`Back to line list`,
    onUploadComplete,
    stepOrder: STEP_ORDER_BULK_EDIT,
    uploadCompleteButtonCallback: onClose,
    uploadCompleteButtonLabel: t`Back to line list`,
  }), [caseRightsColMap, casesForVerificationFromSourceData, completeCaseType, onClose, onUploadComplete, t]);

  useEffect(() => {
    return () => {
      epiUploadStore.getState().destroy().catch(noop);
    };
  }, [epiUploadStore]);

  return (
    <ResponseHandler loadables={loadables}>
      <EpiUploadStoreContext value={epiUploadStore}>
        <EpiUpload />
      </EpiUploadStoreContext>
    </ResponseHandler>
  );
};
