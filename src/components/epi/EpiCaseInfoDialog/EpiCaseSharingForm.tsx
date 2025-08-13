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
import { useForm } from 'react-hook-form';
import difference from 'lodash/difference';
import {
  Box,
  Typography,
  type BoxProps,
} from '@mui/material';

import { useEpiCaseAbacContext } from '../../../context/epiCaseAbac';
import type { Case } from '../../../api';
import { CaseApi } from '../../../api';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { FormUtil } from '../../../utils/FormUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { GenericForm } from '../../form/helpers/GenericForm';
import { Spinner } from '../../ui/Spinner';

export type EpiCaseSharingFormProps = {
  readonly epiCase: Case;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

type FormFields = {
  dataCollectionIds: string[];
};

export const EpiCaseSharingForm = ({ formId, epiCase, onFinish, onIsSavingChange, ...boxProps }: EpiCaseSharingFormProps) => {
  const [t] = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const caseAbacContext = useEpiCaseAbacContext();

  const schema = useMemo(() => object<FormFields>().shape({
    dataCollectionIds: array().of(string().uuid4()).required(),
  }), []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: 'dataCollectionIds',
      label: t`Data collections`,
      options: caseAbacContext?.itemDataCollectionOptions?.[0] ?? [],
      multiple: true,
    } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t, caseAbacContext?.itemDataCollectionOptions]);

  const item = useMemo<FormFields>(() => {
    return {
      dataCollectionIds: caseAbacContext?.rights?.[0]?.shared_in_data_collection_ids ?? [],
    };
  }, [caseAbacContext?.rights]);

  const values = useMemo<FormFields>(() => FormUtil.createFormValues(formFieldDefinitions, item), [formFieldDefinitions, item]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema),
    values,
  });
  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback(({ dataCollectionIds }: FormFields) => {
    const perform = async () => {
      setIsSaving(true);
      onIsSavingChange(true);
      const queryKeys = QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_DATA_COLLECTION_LINKS], true);
      const notificationKey = NotificationManager.instance.showNotification({
        message: t('Saving case data collections...'),
        isLoading: true,
        severity: 'info',
      });
      try {
        await QueryUtil.cancelQueries(queryKeys);
        const rights = caseAbacContext?.rights?.[0];
        const dataCollectionIdsToAdd = difference(dataCollectionIds, rights.shared_in_data_collection_ids);
        const dataCollectionIdsToRemove = difference(rights.shared_in_data_collection_ids, dataCollectionIds);

        if (dataCollectionIdsToAdd.length > 0) {
          await CaseApi.getInstance().caseDataCollectionLinksPostSome(dataCollectionIdsToAdd.map(data_collection_id => ({
            case_id: epiCase.id,
            data_collection_id,
          })));
        }
        if (dataCollectionIdsToRemove.length > 0) {
          await CaseApi.getInstance().caseDataCollectionLinksDeleteSome(caseAbacContext.itemDataCollectionLinks[0]?.filter(x => dataCollectionIdsToRemove.includes(x.data_collection_id)).map(x => x.id).join(','));
        }
        NotificationManager.instance.fulfillNotification(notificationKey, t('Successfully saved case data collections.'), 'success');
      } catch (_error) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Could not save case data collections.'), 'error');
      } finally {
        await QueryUtil.invalidateQueryKeys(queryKeys);
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
      />
    </Box>
  );
};
