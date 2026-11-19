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
  SeqDbSample,
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
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSample, 'created_in_data_collection' | 'props'>;

const requireId = (id: SeqDbSample['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a sample without an ID.');
  }
  return id;
};

export const SamplesAdminPage = () => {
  const { t } = useTranslation();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const loadables = useArray([dataCollectionOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).samplesGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).samplesPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSample) => {
    const id = requireId(item.id);
    return (await container.resolve(SeqDbSeqApi).samplesPutOne(
      id,
      { ...variables, id, props: item.props },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSample) => {
    return container.resolve(SeqDbSeqApi).samplesDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSample) => {
    const code = item.code?.trim();
    const dataCollectionName = dataCollectionOptionsQuery.options.find(
      option => option.value === item.created_in_data_collection_id,
    )?.label ?? item.created_in_data_collection_id;
    return code || dataCollectionName || ('id' in item && item.id) || '';
  }, [dataCollectionOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: string().nullable().optional(),
      created_in_data_collection_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Created in data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'created_in_data_collection_id',
        options: dataCollectionOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbSample>[] => {
    return [
      TableUtil.createTextColumn<SeqDbSample>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<SeqDbSample>({
        id: 'created_in_data_collection_id',
        name: t`Created in data collection`,
        options: dataCollectionOptionsQuery.options,
      }),
    ];
  }, [dataCollectionOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSample, SeqDbSample, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sample`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SampleCrudCommand}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sample`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SAMPLES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SamplesAdminPage')}
      title={t`Samples`}
      updateOne={updateOne}
    />
  );
};
