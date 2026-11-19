import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbSampleDataCollectionLink,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
} from '@gen-epix/api-seqdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSampleDataCollectionLink, 'data_collection' | 'sample'>;

const requireId = (id: SeqDbSampleDataCollectionLink['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a sample data collection link without an ID.');
  }
  return id;
};

export const SampleDataCollectionLinksAdminPage = () => {
  const { t } = useTranslation();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const loadables = useArray([sampleOptionsQuery, dataCollectionOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).sampleDataCollectionLinksGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).sampleDataCollectionLinksPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSampleDataCollectionLink) => {
    const id = requireId(item.id);
    return (await container.resolve(SeqDbSeqApi).sampleDataCollectionLinksPutOne(
      id,
      { ...variables, id },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSampleDataCollectionLink) => {
    return container.resolve(SeqDbSeqApi).sampleDataCollectionLinksDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSampleDataCollectionLink) => {
    const sampleName = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    const dataCollectionName = dataCollectionOptionsQuery.options.find(option => option.value === item.data_collection_id)?.label ?? item.data_collection_id;
    return [sampleName, dataCollectionName].filter(Boolean).join(' - ') || ('id' in item && item.id) || '';
  }, [dataCollectionOptionsQuery.options, sampleOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      data_collection_id: string().required(),
      sample_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Sample`,
        loading: sampleOptionsQuery.isLoading,
        name: 'sample_id',
        options: sampleOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'data_collection_id',
        options: dataCollectionOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, sampleOptionsQuery.isLoading, sampleOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbSampleDataCollectionLink>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbSampleDataCollectionLink>({ id: 'sample_id', name: t`Sample`, options: sampleOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbSampleDataCollectionLink>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
    ];
  }, [dataCollectionOptionsQuery.options, sampleOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSampleDataCollectionLink, SeqDbSampleDataCollectionLink, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sample data collection link`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SampleDataCollectionLinkCrudCommand}
      defaultSortByField={'sample_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sample data collection link`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SAMPLE_DATA_COLLECTION_LINKS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SampleDataCollectionLinksAdminPage')}
      title={t`Sample data collection links`}
      updateOne={updateOne}
    />
  );
};
