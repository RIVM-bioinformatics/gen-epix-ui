import type {
  CaseDbCase,
  CaseDbCaseForUpload,
} from '@gen-epix/api-casedb';
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
  createUploadStore,
  STEP_ORDER_BULK_EDIT,
  UploadStoreContext,
} from '../../../stores/uploadStore';
import { Upload } from '../Upload';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { useCaseRightsQuery } from '../../../dataHooks/useCaseRightsQuery';

export type DashboardEditCasesProps = {
  cases: CaseDbCase[];
  onClose: () => void;
};

export const DashboardEditCases = ({ cases, onClose }: DashboardEditCasesProps) => {
  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const fetchData = useStore(dashboardStore, (state) => state.fetchData);
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

  const casesForVerificationFromSourceData = useMemo<CaseDbCaseForUpload[]>(() => {
    return cases.map<CaseDbCaseForUpload>((caseItem) => ({
      case: {
        ...caseItem,
      },
      id: caseItem.id,
    } satisfies CaseDbCaseForUpload));
  }, [cases]);

  const onUploadComplete = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const uploadStore = useMemo(() => createUploadStore({
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
      uploadStore.getState().destroy().catch(noop);
    };
  }, [uploadStore]);

  return (
    <ResponseHandler loadables={loadables}>
      <UploadStoreContext value={uploadStore}>
        <Upload />
      </UploadStoreContext>
    </ResponseHandler>
  );
};
