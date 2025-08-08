import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { Organization } from '../../api';
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

type FormFields = Pick<Organization, 'name' | 'legal_entity_code'>;

export const OrganizationsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().organizationsGetAll({ signal }))?.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Organization) => {
    return (await OrganizationApi.getInstance().organizationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.getInstance().organizationsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Organization) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      legal_entity_code: string().extendedAlphaNumeric().required().max(100),
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
        name: 'legal_entity_code',
        label: t`Legal entity code`,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Organization>[] => {
    return [
      TableUtil.createTextColumn<Organization>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createTextColumn<Organization>({ id: 'legal_entity_code', name: t`Legal entity code` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, Organization>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationsAdminPage')}
      title={t`Organizations`}
      updateOne={updateOne}
    />
  );
};
