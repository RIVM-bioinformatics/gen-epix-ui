import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  number,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import type { CaseTypeDim } from '../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../api';
import {
  useCaseTypeMapQuery,
  useCaseTypeOptionsQuery,
} from '../../dataHooks/useCaseTypesQuery';
import { useArray } from '../../hooks/useArray';
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
import { useDimOptionsQuery } from '../../dataHooks/useDimsQuery';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { DialogAction } from '../../components/ui/Dialog';

type FormFields = Pick<CaseTypeDim, 'case_type_id' | 'dim_id' | 'occurrence' | 'code' | 'label' | 'description' | 'rank' | 'is_case_date_dim'>;

export const CaseTypeDimsAdminPage = () => {
  const { caseTypeId } = useParams();
  const [t] = useTranslation();
  const dimOptionsQuery = useDimOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const loadables = useArray([caseTypeOptionsQuery, dimOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.caseTypeDimsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((caseTypeDims: CaseTypeDim[]) => {
    if (caseTypeId) {
      return caseTypeDims.filter((dim) => dim.case_type_id === caseTypeId);
    }
    return caseTypeDims;
  }, [caseTypeId]);

  const deleteOne = useCallback(async (item: CaseTypeDim) => {
    return await CaseApi.instance.caseTypeDimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeDim) => {
    return (await CaseApi.instance.caseTypeDimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseTypeDimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseTypeDim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      rank: number().integer().positive().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      occurrence: number().integer().positive().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      dim_id: string().uuid4().required().max(100),
      case_type_id: string().uuid4().required().max(100),
      description: string().freeFormText().required().max(100),
      is_case_date_dim: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const definitions: FormFieldDefinition<FormFields>[] = [];

    if (!caseTypeId) {
      definitions.push(
        {
          definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
          name: 'case_type_id',
          label: t`Case type`,
          options: caseTypeOptionsQuery.options,
        } as const satisfies FormFieldDefinition<FormFields>,
      );
    }

    definitions.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'label',
        label: t`Label`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_id',
        label: t`Dimension`,
        options: dimOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'occurrence',
        label: t`Occurrence`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    );

    return definitions;
  }, [caseTypeId, caseTypeOptionsQuery.options, dimOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseTypeDim>[] => {
    const columns: TableColumn<CaseTypeDim>[] = [];

    if (!caseTypeId) {
      columns.push(
        TableUtil.createOptionsColumn<CaseTypeDim>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createOptionsColumn<CaseTypeDim>({ id: 'dim_id', name: t`Dimension`, options: dimOptionsQuery.options }),
      TableUtil.createTextColumn<CaseTypeDim>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<CaseTypeDim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<CaseTypeDim>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [caseTypeId, caseTypeOptionsQuery.options, dimOptionsQuery.options, t]);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      case_type_id: caseTypeId ?? null,
    };
  }, [caseTypeId]);

  const doesUserHavePermissionToViewCaseTypeColumns = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ContactCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<CaseTypeDim>) => {
    if (!doesUserHavePermissionToViewCaseTypeColumns) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: caseTypeId ? `/management/case-types/${caseTypeId}/case-type-dimensions/${params.row.id}/case-type-columns` : `/management/case-type-dimensions/${params.row.id}/case-type-columns`,
        })}
      >
        <ListItemIcon />
        <ListItemText>
          {t`Manage case type columns`}
        </ListItemText>
      </MenuItem>
    )];
  }, [caseTypeId, doesUserHavePermissionToViewCaseTypeColumns, t]);


  const editDialogExtraActionsFactory = useCallback((item: CaseTypeDim): DialogAction[] => {
    if (!doesUserHavePermissionToViewCaseTypeColumns) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('CaseTypeDimsAdminPage-ManageCaseTypeDimensionsButton'),
        label: t`Manage case type columns`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: caseTypeId ? `/management/case-types/${caseTypeId}/case-type-dimensions/${item.id}/case-type-columns` : `/management/case-type-dimensions/${item.id}/case-type-columns`,
        }),
      },
    ];
  }, [caseTypeId, doesUserHavePermissionToViewCaseTypeColumns, t]);

  const title = useMemo(() => {
    if (caseTypeId && caseTypeMapQuery.map.has(caseTypeId)) {
      return t('{{caseType}} → Case type dimensions', { caseType: caseTypeMapQuery.map.get(caseTypeId)?.name });
    }

    return t`Case type dimensions`;
  }, [caseTypeId, caseTypeMapQuery.map, t]);

  return (
    <CrudPage<FormFields, CaseTypeDim>
      createOne={createOne}
      defaultNewItem={defaultNewItem}
      fetchAllSelect={fetchAllSelect}
      extraActionsFactory={extraActionsFactory}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      crudCommandType={CommandName.CaseTypeDimCrudCommand}
      createItemDialogTitle={t`Create new case type dim`}
      defaultSortByField={caseTypeId ? 'rank' : 'case_type_id'}
      defaultSortDirection={'asc'}
      tableStoreStorageNamePostFix={caseTypeId ? `CaseType` : undefined}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_DIMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeDimsAdminPage')}
      title={title}
      updateOne={updateOne}
    />
  );
};
