import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
} from 'yup';

import type { ConceptSet } from '../../api';
import {
  OntologyApi,
  CommandName,
  ConceptSetType,
  PermissionType,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { useConceptSetTypeOptionsQuery } from '../../dataHooks/useConceptSetTypeQuery';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';


type FormFields = OmitWithMetaData<ConceptSet>;

export const ConceptSetsAdminPage = () => {
  const conceptSetTypeOptionsQuery = useConceptSetTypeOptionsQuery();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.instance.conceptSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: ConceptSet) => {
    return await OntologyApi.instance.conceptSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: ConceptSet) => {
    return (await OntologyApi.instance.conceptSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.instance.conceptSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: ConceptSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: SchemaUtil.name,
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      type: mixed<ConceptSetType>().required().oneOf(Object.values(ConceptSetType)),
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
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'type',
        label: t`Type`,
        options: conceptSetTypeOptionsQuery.options,
        loading: conceptSetTypeOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptSetTypeOptionsQuery.isLoading, conceptSetTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<ConceptSet>[] => {
    return [
      TableUtil.createTextColumn<ConceptSet>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<ConceptSet>({ id: 'type', name: t`Type`, options: conceptSetTypeOptionsQuery.options }),
    ];
  }, [conceptSetTypeOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<ConceptSet>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ConceptCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage concepts`,
        getPathName: (item: ConceptSet) => `/management/concept-sets/${item.id}/concepts`,
      } satisfies CrudPageSubPage<ConceptSet>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, ConceptSet>
      createOne={createOne}
      crudCommandType={CommandName.ConceptSetCrudCommand}
      createItemDialogTitle={t`Create new concept set`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      subPages={subPages}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CONCEPT_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptSetsAdminPage')}
      title={t`Concepts`}
      updateOne={updateOne}
    />
  );
};
