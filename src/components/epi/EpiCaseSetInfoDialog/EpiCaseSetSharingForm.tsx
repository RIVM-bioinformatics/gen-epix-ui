import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  boolean,
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import difference from 'lodash/difference';
import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';

import type { CaseSet } from '../../../api';
import { CaseApi } from '../../../api';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { useCaseAbacContext } from '../../../context/caseAbac';
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { QUERY_KEY } from '../../../models/query';
import { CaseUtil } from '../../../utils/CaseUtil';
import { FormUtil } from '../../../utils/FormUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { GenericForm } from '../../form/helpers/GenericForm';
import { Spinner } from '../../ui/Spinner';

export type EpiCaseSetSharingFormProps = {
  readonly caseTypeId: string;
  readonly caseSet: CaseSet;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

type FormFields = {
  dataCollectionIds?: string[];
  shouldApplySharingToCases?: boolean;
};

export const EpiCaseSetSharingForm = ({ caseTypeId, formId, caseSet, onFinish, onIsSavingChange, ...boxProps }: EpiCaseSetSharingFormProps) => {
  const [t] = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const schema = useMemo(() => object<FormFields>().shape({
    dataCollectionIds: array().of(string().uuid4()).required(),
    shouldApplySharingToCases: boolean().required(),
  }), []);

  const caseAbacContext = useCaseAbacContext();

  const onFormSubmit = useCallback(({ dataCollectionIds, shouldApplySharingToCases }: FormFields) => {
    const perform = async () => {
      setIsSaving(true);
      onIsSavingChange(true);
      const queryKeys = QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS], true);
      const notificationKey = NotificationManager.instance.showNotification({
        message: t('Saving case set data collections'),
        severity: 'info',
        isLoading: true,
      });
      try {
        await QueryUtil.cancelQueries(queryKeys);
        const rights = caseAbacContext?.rights?.[0];
        const dataCollectionIdsToAdd = difference(dataCollectionIds, rights.shared_in_data_collection_ids);
        const dataCollectionIdsToRemove = difference(rights.shared_in_data_collection_ids, dataCollectionIds);

        if (dataCollectionIdsToAdd.length > 0) {
          await CaseApi.instance.caseSetDataCollectionLinksPostSome(dataCollectionIdsToAdd.map(data_collection_id => ({
            case_set_id: caseSet.id,
            data_collection_id,
          })));
        }
        if (dataCollectionIdsToRemove.length > 0) {
          await CaseApi.instance.caseSetDataCollectionLinksDeleteSome(caseAbacContext.itemDataCollectionLinks[0]?.filter(x => dataCollectionIdsToRemove.includes(x.data_collection_id)).map(x => x.id).join(','));
        }
        NotificationManager.instance.fulfillNotification(notificationKey, t('Successfully saved case set data collections.'), 'success');
      } catch (_error) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Could not save case set data collections.'), 'error');
      } finally {
        await QueryUtil.invalidateQueryKeys(queryKeys);
        if (shouldApplySharingToCases) {
          await CaseUtil.applyDataCollectionLinks({
            caseSetId: caseSet.id,
            caseSetDataCollectionIds: dataCollectionIds,
            caseTypeId,
          });
        }

        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [onIsSavingChange, t, caseAbacContext?.rights, caseAbacContext.itemDataCollectionLinks, caseTypeId, caseSet.id, onFinish]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: 'dataCollectionIds',
      label: t`Data collections`,
      options: caseAbacContext?.itemDataCollectionOptions?.[0] ?? [],
      multiple: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
      name: 'shouldApplySharingToCases',
      label: t`Should the same sharing be applied to the cases in the event?`,
    } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [caseAbacContext?.itemDataCollectionOptions, t]);

  const item = useMemo<FormFields>(() => {
    return {
      dataCollectionIds: caseAbacContext?.rights?.[0]?.shared_in_data_collection_ids ?? [],
      shouldApplySharingToCases: true,
    };
  }, [caseAbacContext?.rights]);

  const values = useMemo<FormFields>(() => FormUtil.createFormValues(formFieldDefinitions, item), [formFieldDefinitions, item]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values,
  });
  const { handleSubmit } = formMethods;


  if (isSaving) {
    return (
      <Spinner
        inline
        label={t`Saving case set data collections`}
      />
    );
  }

  return (
    <Box {...boxProps}>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        schema={schema}
        onSubmit={handleSubmit(onFormSubmit)}
      />
    </Box>
  );
};
