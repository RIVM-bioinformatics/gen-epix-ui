import {
  use,
  useCallback,
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
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  NotificationManager,
  ObjectUtil,
  QueryClientManager,
  Spinner,
} from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import { EpiCaseContentForm } from '../EpiCaseContentForm';

export type EpiCaseInfoFormProps = {
  readonly epiCase: CaseDbCase;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

export const EpiCaseInfoForm = ({ epiCase, formId, onFinish, onIsSavingChange, ...boxProps }: EpiCaseInfoFormProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);

  const mutateCachedCase = useStore(epiDashboardStore, useShallow((state) => state.mutateCachedCase));
  const [isSaving, setIsSaving] = useState(false);

  const onFormSubmit = useCallback((content: CaseDbCase['content']) => {
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
        const item = {
          ...epiCase,
          content: ObjectUtil.mergeWithUndefined(epiCase.content, content),
        };
        await CaseDbCaseApi.getInstance().casesPutOne(item.id, item);
        mutateCachedCase(item.id, item);
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
  }, [epiCase, mutateCachedCase, onFinish, onIsSavingChange]);

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
            completeCaseType={completeCaseType}
            formId={formId}
            onSubmit={onFormSubmit}
          />
        )}
      </Box>
    </Box>
  );
};
