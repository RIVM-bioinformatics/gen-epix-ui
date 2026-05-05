import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type { CaseDbIdentifierIssuer } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
} from '@gen-epix/api-casedb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<CaseDbIdentifierIssuer>;

export const IdentifierIssuersAdminPage = () => {
  const { t } = useTranslation();


  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.getInstance().identifierIssuersGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbIdentifierIssuer) => {
    return await CaseDbOrganizationApi.getInstance().identifierIssuersDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbIdentifierIssuer) => {
    return (await CaseDbOrganizationApi.getInstance().identifierIssuersPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOrganizationApi.getInstance().identifierIssuersPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbIdentifierIssuer) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
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
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbIdentifierIssuer>[] => {
    return [
      TableUtil.createTextColumn<CaseDbIdentifierIssuer>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<CaseDbIdentifierIssuer>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbIdentifierIssuer>
      createItemDialogTitle={t`Create new identifier issuer`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.IdentifierIssuerCrudCommand}
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
