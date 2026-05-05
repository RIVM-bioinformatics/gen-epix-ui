import {
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { t } from 'i18next';
import { useShallow } from 'zustand/shallow';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Box,
  type BoxProps,
  Typography,
} from '@mui/material';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { useOrganizationsQuery, QueryManager, QUERY_KEY, NotificationManager, ObjectUtil, FormUtil, Spinner, GenericForm } from '@gen-epix/ui';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseUtil } from '../../../utils/CaseUtil';

export type EpiCaseFormProps = {
  readonly epiCase: CaseDbCase;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

export const EpiCaseForm = ({ epiCase, formId, onFinish, onIsSavingChange, ...boxProps }: EpiCaseFormProps) => {
  const organizationsQuery = useOrganizationsQuery();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const schema = useMemo(() => CaseUtil.createYupSchema(completeCaseType), [completeCaseType]);
  const formFieldDefinitions = useMemo(() => CaseUtil.createFormFieldDefinitions(completeCaseType, organizationsQuery), [completeCaseType, organizationsQuery]);
  const mutateCachedCase = useStore(epiDashboardStore, useShallow((state) => state.mutateCachedCase));
  const [isSaving, setIsSaving] = useState(false);

  const onFormSubmit = useCallback((content: CaseDbCase['content']) => {
    setIsSaving(true);
    onIsSavingChange(true);
    const perform = async () => {
      const queryKeys = QueryManager.getInstance().getQueryKeyDependencies([QUERY_KEY.CASES], true);
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: t('Saving case data'),
        severity: 'info',
      });
      try {
        await QueryManager.getInstance().cancelQueries(queryKeys);
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
        await QueryManager.getInstance().invalidateQueryKeys(queryKeys);
        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [epiCase, mutateCachedCase, onFinish, onIsSavingChange]);

  const values = useMemo<CaseDbCase['content']>(() => FormUtil.createFormValues(formFieldDefinitions, epiCase.content), [formFieldDefinitions, epiCase.content]);
  const formMethods = useForm<CaseDbCase['content']>({
    resolver: yupResolver(schema) as unknown as Resolver<CaseDbCase['content']>,
    values,
  });
  const { handleSubmit } = formMethods;

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
          <GenericForm<CaseDbCase['content']>
            formFieldDefinitions={formFieldDefinitions}
            formId={formId}
            formMethods={formMethods}
            onSubmit={handleSubmit(onFormSubmit)}
            schema={schema}
          />
        )}
      </Box>
    </Box>
  );
};
