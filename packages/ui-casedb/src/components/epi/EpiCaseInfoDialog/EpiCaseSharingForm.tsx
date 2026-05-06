import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import difference from 'lodash/difference';
import {
  Box,
  type BoxProps,
  Typography,
} from '@mui/material';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { FormFieldDefinition } from '@gen-epix/ui';
import {
  FORM_FIELD_DEFINITION_TYPE,
  FormUtil,
  GenericForm,
  NotificationManager,
  QueryClientManager,
  Spinner,
} from '@gen-epix/ui';

import { useCaseAbacContext } from '../../../context/caseAbac';
import { CASEDB_QUERY_KEY } from '../../../data/query';

export type EpiCaseSharingFormProps = {
  readonly epiCase: CaseDbCase;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

type FormFields = {
  dataCollectionIds?: string[];
};

export const EpiCaseSharingForm = ({ epiCase, formId, onFinish, onIsSavingChange, ...boxProps }: EpiCaseSharingFormProps) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const caseAbacContext = useCaseAbacContext();

  const schema = useMemo(() => object<FormFields>().shape({
    dataCollectionIds: array().of(string().uuid4()).required(),
  }), []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Data collections`,
      multiple: true,
      name: 'dataCollectionIds',
      options: caseAbacContext?.itemDataCollectionOptions?.[0] ?? [],
    } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t, caseAbacContext?.itemDataCollectionOptions]);

  const item = useMemo<FormFields>(() => {
    return {
      dataCollectionIds: caseAbacContext?.rights?.[0]?.shared_in_data_collection_ids ?? [],
    };
  }, [caseAbacContext?.rights]);

  const values = useMemo<FormFields>(() => FormUtil.createFormValues(formFieldDefinitions, item), [formFieldDefinitions, item]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values,
  });
  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback(({ dataCollectionIds }: FormFields) => {
    const perform = async () => {
      setIsSaving(true);
      onIsSavingChange(true);
      const queryKeys = QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASE_DATA_COLLECTION_LINKS], true);
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: t('Saving case data collections'),
        severity: 'info',
      });
      try {
        await QueryClientManager.getInstance().cancelQueries(queryKeys);
        const rights = caseAbacContext?.rights?.[0];
        const dataCollectionIdsToAdd = difference(dataCollectionIds, rights.shared_in_data_collection_ids);
        const dataCollectionIdsToRemove = difference(rights.shared_in_data_collection_ids, dataCollectionIds);

        if (dataCollectionIdsToAdd.length > 0) {
          await CaseDbCaseApi.getInstance().caseDataCollectionLinksPostSome(dataCollectionIdsToAdd.map(data_collection_id => ({
            case_id: epiCase.id,
            data_collection_id,
          })));
        }
        if (dataCollectionIdsToRemove.length > 0) {
          await CaseDbCaseApi.getInstance().caseDataCollectionLinksDeleteSome(caseAbacContext.itemDataCollectionLinks[0]?.filter(x => dataCollectionIdsToRemove.includes(x.data_collection_id)).map(x => x.id).join(','));
        }
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Successfully saved case data collections.'), 'success');
      } catch (_error) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Could not save case data collections.'), 'error');
      } finally {
        await QueryClientManager.getInstance().invalidateQueryKeys(queryKeys);
        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [caseAbacContext.itemDataCollectionLinks, caseAbacContext?.rights, epiCase.id, onFinish, onIsSavingChange, t]);

  if (isSaving) {
    return (
      <Spinner
        inline
        label={t`Saving case data collections`}
      />
    );
  }

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Data collections`}
      </Typography>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
        schema={schema}
      />
    </Box>
  );
};
