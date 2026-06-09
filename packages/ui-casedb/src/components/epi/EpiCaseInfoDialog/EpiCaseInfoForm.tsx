import {
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { t } from 'i18next';
import { useShallow } from 'zustand/shallow';
import {
  Box,
  Typography,
} from '@mui/material';
import type { BoxProps } from '@mui/material';
import type {
  CaseDbCase,
  CaseDbCaseRights,
} from '@gen-epix/api-casedb';
import {
  CaseDbEtlStatus,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';
import {
  NotificationManager,
  QueryClientManager,
  Spinner,
} from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import { EpiCaseContentForm } from '../EpiCaseContentForm';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

export type EpiCaseInfoFormProps = {
  readonly caseRights: CaseDbCaseRights;
  readonly epiCase: CaseDbCase;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

export const EpiCaseInfoForm = ({ caseRights, epiCase, formId, onFinish, onIsSavingChange, ...boxProps }: EpiCaseInfoFormProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);

  const mutateCachedCase = useStore(epiDashboardStore, useShallow((state) => state.mutateCachedCase));
  const [isSaving, setIsSaving] = useState(false);

  const enabledColIds = useMemo(() => {
    const colIds: string[] = [];

    caseRights.read_col_ids.forEach(colId => {
      if (caseRights.write_col_ids.includes(colId)) {
        colIds.push(colId);
      }
    });
    return colIds;
  }, [caseRights]);

  const onFormSubmit = useCallback((caseId: string, content: CaseDbCase['content']) => {
    setIsSaving(true);
    onIsSavingChange(true);
    const perform = async () => {
      const queryKeys = QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASES], true);
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: t('Saving case data'),
        severity: 'info',
      });
      try {
        await QueryClientManager.getInstance().cancelQueries(queryKeys);
        const uploadResult = (await EpiUploadUtil.uploadCasesWithMultipleCreatedInDataCollectionIds({
          case_batch: {
            cases: [
              {
                case: {
                  case_type_id: completeCaseType.id,
                  content,
                  created_in_data_collection_id: epiCase.created_in_data_collection_id,
                  id: caseId,
                },
              },
            ],
          },
          case_type_id: completeCaseType.id,
          created_in_data_collection_id: epiCase.created_in_data_collection_id,
          on_exists: CaseDbUploadAction.UPDATE,
        }));
        if (uploadResult.status !== CaseDbEtlStatus.SKIPPED && uploadResult.status !== CaseDbEtlStatus.SUCCESS && uploadResult.status !== CaseDbEtlStatus.UPDATED) {
          throw new Error('Case upload failed');
        }
        // await CaseDbCaseApi.getInstance().casesPutOne(item.id, item);
        mutateCachedCase(epiCase.id, epiCase);
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Successfully saved case data.'), 'success');
      } catch (_error) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Could not save case data.'), 'error');
      } finally {
        await QueryClientManager.getInstance().invalidateQueryKeys(queryKeys);
        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [completeCaseType.id, epiCase, mutateCachedCase, onFinish, onIsSavingChange]);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>
      <Box>
        {isSaving && (
          <Spinner
            inline
            label={t`Saving case data`}
          />
        )}
        {!isSaving && (
          <EpiCaseContentForm
            caseContent={epiCase.content}
            caseId={epiCase.id}
            completeCaseType={completeCaseType}
            enabledColIds={enabledColIds}
            formId={formId}
            onSubmit={onFormSubmit}
          />
        )}
      </Box>
    </Box>
  );
};
