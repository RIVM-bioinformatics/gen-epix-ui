import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';

import type { Contact } from '../../api';
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
import { CrudPage } from '../CrudPage';

type FormFields = Pick<Contact, 'name' | 'email' | 'phone'>;

export const OrganizationContactsAdminPage = () => {
  const { siteId } = useParams();
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().contactsGetAll({ signal })).data;
  }, []);

  const fetchAllSelect = useCallback((contacts: Contact[]) => {
    return contacts.filter((contact) => contact.site_id === siteId);
  }, [siteId]);

  const updateOne = useCallback(async (variables: FormFields, item: Contact) => {
    return (await OrganizationApi.getInstance().contactsPutOne(item.id, {
      id: item.id,
      site_id: siteId,
      ...variables,
    })).data;
  }, [siteId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.getInstance().contactsPostOne({
      site_id: siteId,
      ...variables,
    })).data;
  }, [siteId]);

  const deleteOne = useCallback(async (item: Contact) => {
    return await OrganizationApi.getInstance().contactsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      email: string().email().max(256),
      phone: string().extendedAlphaNumeric().max(100),
    });
  }, []);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Contact): Contact => {
    return {
      id: previousItem.id,
      site_id: previousItem.site_id,
      ...variables,
    };
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'email',
        label: t`Email`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'phone',
        label: t`Phone`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Contact>[] => {
    return [
      TableUtil.createTextColumn<Contact>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createTextColumn<Contact>({ id: 'email', name: t`Email` }),
      TableUtil.createTextColumn<Contact>({ id: 'phone', name: t`Phone` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, Contact>
      createOne={createOne}
      crudCommandType={CommandName.ContactCrudCommand}
      createItemDialogTitle={t`Create new contact`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      resourceQueryKeyBase={QUERY_KEY.CONTACTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationContactsAdminPage')}
      title={t`Site Contacts`}
      updateOne={updateOne}
    />
  );
};
