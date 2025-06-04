import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import { CrudPage } from '../CrudPage';
import type { DataCollection } from '../../api';
import {
  OrganizationApi,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

type FormFields = Pick<DataCollection, 'name' | 'description'>;

export const DataCollectionsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().dataCollectionsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: DataCollection) => {
    return await OrganizationApi.getInstance().dataCollectionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: DataCollection) => {
    return (await OrganizationApi.getInstance().dataCollectionsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.getInstance().dataCollectionsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(1000),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<DataCollection>[] => {
    return [
      TableUtil.createTextColumn<DataCollection>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<DataCollection>({ id: 'description', name: t`Description` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, DataCollection>
      createOne={createOne}
      crudCommandType={CommandName.DataCollectionCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.DATA_COLLECTIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionsAdminPage')}
      title={`Data collections`}
      updateOne={updateOne}
    />
  );
};
