import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
} from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbConceptSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbConceptSetType,
  CaseDbOntologyApi,
  CaseDbPermissionType,
  CaseDbUnit,
} from '@gen-epix/api-casedb';
import type { CrudPageSubPage } from '@gen-epix/ui/pages/CrudPage';
import type { OmitWithMetaData } from '@gen-epix/ui/models/data';
import type { TableColumn } from '@gen-epix/ui/models/table';
import { AuthorizationService } from '@gen-epix/ui/classes/services/AuthorizationService';
import { CrudPage } from '@gen-epix/ui/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '../../../../ui-core-form-components/src/models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../../ui-core-form-components/src/models/form';
import { SchemaUtil } from '../../../../ui-core-form-components/src/utils/SchemaUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { UseFormReturn } from 'react-hook-form';

import { useUnitOptionsQuery } from '../../dataHooks/useUnitQuery/useUnit';
import { CASEDB_QUERY_KEY } from '../../constants/query';
import { useConceptSetTypeOptionsQuery } from '../../dataHooks/useConceptSetTypeQuery';


type FormFields = OmitWithMetaData<CaseDbConceptSet>;

export const ConceptSetsAdminPage = () => {
  const unitOptionsQuery = useUnitOptionsQuery();
  const conceptSetTypeOptionsQuery = useConceptSetTypeOptionsQuery();

  const loadables = useArray([unitOptionsQuery, conceptSetTypeOptionsQuery]);
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.getInstance().conceptSetsGetAll(null, null, { signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbConceptSet) => {
    return await CaseDbOntologyApi.getInstance().conceptSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbConceptSet) => {
    return (await CaseDbOntologyApi.getInstance().conceptSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.getInstance().conceptSetsPostOne(variables)).data;
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
      unit: mixed<CaseDbUnit>().when('type', {
        is: (type: CaseDbConceptSetType) => type === CaseDbConceptSetType.INTERVAL,
        otherwise: () => mixed<CaseDbUnit>().nullable(),
        then: () => mixed<CaseDbUnit>().required().oneOf(Object.values(CaseDbUnit)),
      }),
    });
  }, []);

  const onFormChange = useCallback((_item: CaseDbConceptSet, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    if (values.type !== CaseDbConceptSetType.INTERVAL) {
      formMethods.setValue('unit', null);
    }
  }, []);

  const formFieldDefinitions = useCallback((item: CaseDbConceptSet, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const type = values?.type ?? item?.type ?? null;

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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: type !== CaseDbConceptSetType.INTERVAL,
        label: t`Unit`,
        loading: unitOptionsQuery.isLoading,
        name: 'unit',
        options: unitOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptSetTypeOptionsQuery.isLoading, conceptSetTypeOptionsQuery.options, t, unitOptionsQuery.isLoading, unitOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<CaseDbConceptSet>[] => {
    return [
      TableUtil.createTextColumn<CaseDbConceptSet>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<CaseDbConceptSet>({ id: 'type', name: t`Type`, options: conceptSetTypeOptionsQuery.options }),
    ];
  }, [conceptSetTypeOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<CaseDbConceptSet>[]>(() => {
    if (!AuthorizationService.getInstance().doesUserHavePermission<CaseDbApiPermission>([
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
    <CrudPage<FormFields, CaseDbConceptSet, CaseDbConceptSet, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new concept set`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.ConceptSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept set`}
      loadables={loadables}
      onFormChange={onFormChange}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.CONCEPT_SETS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptSetsAdminPage')}
      title={t`Concepts`}
      updateOne={updateOne}
    />
  );
};
