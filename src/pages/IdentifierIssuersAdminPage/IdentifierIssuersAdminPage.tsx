import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { IdentifierIssuer } from '../../api';
import {
  CommandName,
  OrganizationApi,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<IdentifierIssuer, 'code' | 'description' | 'name'>;

export const IdentifierIssuersAdminPage = () => {
  const [t] = useTranslation();


  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.identifierIssuersGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: IdentifierIssuer) => {
    return await OrganizationApi.instance.identifierIssuersDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: IdentifierIssuer) => {
    return (await OrganizationApi.instance.identifierIssuersPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.identifierIssuersPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: IdentifierIssuer) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      description: string().freeFormText().required().max(100),
    });
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
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<IdentifierIssuer>[] => {
    return [
      TableUtil.createTextColumn<IdentifierIssuer>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<IdentifierIssuer>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, IdentifierIssuer>
      createOne={createOne}
      crudCommandType={CommandName.IdentifierIssuerCrudCommand}
      createItemDialogTitle={t`Create new identifier issuer`}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.IDENTIFIER_ISSUERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('IdentifierIssuersAdminPage')}
      title={t`Identifier Issuers`}
      updateOne={updateOne}
    />
  );
};
