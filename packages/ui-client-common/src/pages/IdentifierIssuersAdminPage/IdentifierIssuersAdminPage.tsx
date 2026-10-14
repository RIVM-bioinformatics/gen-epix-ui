import { container as rootContainer } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';
import { CommonDbCommandName } from '@gen-epix/api-commondb';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { API_ORGANIZATION_TOKEN } from '../../models/api.models';
import type { TableColumn } from '../../models/table.models';
import { TableUtil } from '../../utils/TableUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data.models';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<CommonDbIdentifierIssuer>;

export const IdentifierIssuersAdminPage = () => {
  const { t } = useTranslation();


  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await rootContainer.resolve(API_ORGANIZATION_TOKEN).identifierIssuersGetAll(null, null, { signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CommonDbIdentifierIssuer) => {
    return await rootContainer.resolve(API_ORGANIZATION_TOKEN).identifierIssuersDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CommonDbIdentifierIssuer) => {
    return (await rootContainer.resolve(API_ORGANIZATION_TOKEN).identifierIssuersPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await rootContainer.resolve(API_ORGANIZATION_TOKEN).identifierIssuersPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CommonDbIdentifierIssuer) => {
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

  const tableColumns = useMemo((): TableColumn<CommonDbIdentifierIssuer>[] => {
    return [
      TableUtil.createTextColumn<CommonDbIdentifierIssuer>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<CommonDbIdentifierIssuer>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CommonDbIdentifierIssuer>
      createItemDialogTitle={t`Create new identifier issuer`}
      createOne={createOne}
      crudCommandType={CommonDbCommandName.IdentifierIssuerCrudCommand}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Identifier issuer`}
      resourceQueryKeyBase={COMMON_QUERY_KEY.IDENTIFIER_ISSUERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('IdentifierIssuersAdminPage')}
      title={t`Identifier Issuers`}
      updateOne={updateOne}
    />
  );
};
