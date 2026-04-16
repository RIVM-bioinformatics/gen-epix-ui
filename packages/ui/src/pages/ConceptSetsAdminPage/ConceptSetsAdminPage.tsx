import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
} from 'yup';
import type { CaseDbConceptSet } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbConceptSetType,
  CaseDbOntologyApi,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

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


type FormFields = OmitWithMetaData<CaseDbConceptSet>;

export const ConceptSetsAdminPage = () => {
  const conceptSetTypeOptionsQuery = useConceptSetTypeOptionsQuery();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.instance.conceptSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbConceptSet) => {
    return await CaseDbOntologyApi.instance.conceptSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbConceptSet) => {
    return (await CaseDbOntologyApi.instance.conceptSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.instance.conceptSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbConceptSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      name: SchemaUtil.name,
      type: mixed<CaseDbConceptSetType>().required().oneOf(Object.values(CaseDbConceptSetType)),
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
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Type`,
        loading: conceptSetTypeOptionsQuery.isLoading,
        name: 'type',
        options: conceptSetTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptSetTypeOptionsQuery.isLoading, conceptSetTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbConceptSet>[] => {
    return [
      TableUtil.createTextColumn<CaseDbConceptSet>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<CaseDbConceptSet>({ id: 'type', name: t`Type`, options: conceptSetTypeOptionsQuery.options }),
    ];
  }, [conceptSetTypeOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<CaseDbConceptSet>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbConceptSet) => `/management/concept-sets/${item.id}/concepts`,
        label: t`Manage concepts`,
      } satisfies CrudPageSubPage<CaseDbConceptSet>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbConceptSet>
      createItemDialogTitle={t`Create new concept set`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.ConceptSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CONCEPT_SETS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptSetsAdminPage')}
      title={t`Concepts`}
      updateOne={updateOne}
    />
  );
};
