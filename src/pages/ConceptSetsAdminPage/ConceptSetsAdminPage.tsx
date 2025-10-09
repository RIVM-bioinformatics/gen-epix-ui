import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';
import {
  MenuItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';

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
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { useConceptSetTypeOptionsQuery } from '../../dataHooks/useConceptSetTypeQuery';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { DialogAction } from '../../components/ui/Dialog';


type FormFields = Omit<ConceptSet, 'id'>;

export const ConceptSetsAdminPage = () => {
  const conceptSetTypeOptionsQuery = useConceptSetTypeOptionsQuery();
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().conceptSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: ConceptSet) => {
    return await OntologyApi.getInstance().conceptSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: ConceptSet) => {
    return (await OntologyApi.getInstance().conceptSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().conceptSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: ConceptSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      code: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(1000),
      type: mixed<ConceptSetType>().required().oneOf(Object.values(ConceptSetType)),
      regex: string().when('type', {
        is: (type: ConceptSetType) => type === ConceptSetType.REGULAR_LANGUAGE,
        then: () => string().regex().max(500).required(),
        otherwise: () => string().regex().max(500).nullable().notRequired(),
      }),
      schema_definition: string().when('type', {
        is: (type: ConceptSetType) => ([ConceptSetType.CONTEXT_FREE_GRAMMAR_JSON, ConceptSetType.CONTEXT_FREE_GRAMMAR_XML] as ConceptSetType[]).includes(type),
        then: () => string().freeFormText().max(10000).required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      schema_uri: string().when('type', {
        is: (type: ConceptSetType) => ([ConceptSetType.CONTEXT_FREE_GRAMMAR_JSON, ConceptSetType.CONTEXT_FREE_GRAMMAR_XML] as ConceptSetType[]).includes(type),
        then: () => string().url().max(1000).required(),
        otherwise: () => string().url().max(1000).nullable().notRequired(),
      }),
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'regex',
        label: t`Regex`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'schema_uri',
        label: t`Schema URI`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'schema_definition',
        label: t`Schema definition`,
        multiline: true,
        rows: 10,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptSetTypeOptionsQuery.isLoading, conceptSetTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<ConceptSet>[] => {
    return [
      TableUtil.createTextColumn<ConceptSet>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<ConceptSet>({ id: 'type', name: t`Type`, options: conceptSetTypeOptionsQuery.options }),
    ];
  }, [conceptSetTypeOptionsQuery.options, t]);

  const doesUserHavePermissionToViewConcepts = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ConceptCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<ConceptSet>) => {
    if (!doesUserHavePermissionToViewConcepts) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: `/management/concept-sets/${params.row.id}/concepts`,
        })}
      >
        <ListItemIcon />
        <ListItemText>
          {t`Manage concepts`}
        </ListItemText>
      </MenuItem>
    )];
  }, [doesUserHavePermissionToViewConcepts, t]);

  const editDialogExtraActionsFactory = useCallback((item: ConceptSet): DialogAction[] =>{
    if (!doesUserHavePermissionToViewConcepts) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('OrganizationSitesAdminPage-ManageContactsButton'),
        label: t`Manage concepts`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/concept-sets/${item.id}/concepts`,
        }),
      },
    ];
  }, [doesUserHavePermissionToViewConcepts, t]);

  return (
    <CrudPage<FormFields, ConceptSet>
      createOne={createOne}
      crudCommandType={CommandName.ConceptSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      extraActionsFactory={extraActionsFactory}
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
