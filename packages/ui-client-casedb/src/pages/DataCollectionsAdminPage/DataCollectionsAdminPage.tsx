import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
} from '@gen-epix/api-casedb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


type FormFields = OmitWithMetaData<CaseDbDataCollection>;

export const DataCollectionsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(CaseDbOrganizationApi).dataCollectionsGetAll(null, null, { signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbDataCollection) => {
    return await container.resolve(CaseDbOrganizationApi).dataCollectionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDataCollection) => {
    return (await container.resolve(CaseDbOrganizationApi).dataCollectionsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(CaseDbOrganizationApi).dataCollectionsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      name: SchemaUtil.name,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbDataCollection>[] => {
    return [
      TableUtil.createTextColumn<CaseDbDataCollection>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbDataCollection, CaseDbDataCollection, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new data collection`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.DataCollectionCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Data collection`}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.DATA_COLLECTIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionsAdminPage')}
      title={t`Data collections`}
      updateOne={updateOne}
    />
  );
};
