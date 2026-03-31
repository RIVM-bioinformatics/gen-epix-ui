import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';

import type { Dim } from '../../api';
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
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { useRefDimOptionsQuery } from '../../dataHooks/useRefDimsQuery';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<Dim, 'case_type' | 'ref_dim'>;

export const DimsAdminPage = () => {
  const { caseTypeId } = useParams();
  const { t } = useTranslation();
  const refDimOptionsQuery = useRefDimOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const loadables = useArray([caseTypeOptionsQuery, refDimOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.dimsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((dims: Dim[]) => {
    if (caseTypeId) {
      return dims.filter((dim) => dim.case_type_id === caseTypeId);
    }
    return dims;
  }, [caseTypeId]);

  const deleteOne = useCallback(async (item: Dim) => {
    return await CaseApi.instance.dimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Dim) => {
    return (await CaseApi.instance.dimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.dimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Dim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: SchemaUtil.code,
      rank: SchemaUtil.number.required().min(0).integer(),
      occurrence: SchemaUtil.number.required().min(0).integer().positive(),
      ref_dim_id: string().uuid4().required().max(100),
      case_type_id: string().uuid4().required().max(100),
      description: SchemaUtil.description,
      is_case_date_dim: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'ref_dim_id',
        label: t`Reference dimension`,
        options: refDimOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
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
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [caseTypeOptionsQuery.options, refDimOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Dim>[] => {
    const columns: TableColumn<Dim>[] = [];

    if (!caseTypeId) {
      columns.push(
        TableUtil.createOptionsColumn<Dim>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createOptionsColumn<Dim>({ id: 'ref_dim_id', name: t`Reference dimension`, options: refDimOptionsQuery.options }),
      TableUtil.createTextColumn<Dim>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<Dim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<Dim>({ id: 'occurrence', name: t`Occurrence` }),
      TableUtil.createNumberColumn<Dim>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [caseTypeId, caseTypeOptionsQuery.options, refDimOptionsQuery.options, t]);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      case_type_id: caseTypeId ?? null,
    };
  }, [caseTypeId]);

  const subPages = useMemo<CrudPageSubPage<Dim>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage columns`,
        getPathName: (item: Dim) => caseTypeId ? `/management/case-types/${caseTypeId}/dimensions/${item.id}/columns` : `/management/dimensions/${item.id}/columns`,
      } satisfies CrudPageSubPage<Dim>,
    ];
  }, [caseTypeId, t]);

  const title = useMemo(() => {
    const parts: string[] = [];

    if (caseTypeId && caseTypeMapQuery.map.has(caseTypeId)) {
      parts.push(caseTypeMapQuery.map.get(caseTypeId)?.name);
    }
    parts.push(t`Dimensions`);

    return parts;
  }, [caseTypeId, caseTypeMapQuery.map, t]);

  return (
    <CrudPage<FormFields, Dim>
      createOne={createOne}
      defaultNewItem={defaultNewItem}
      fetchAllSelect={fetchAllSelect}
      subPages={subPages}
      crudCommandType={CommandName.DimCrudCommand}
      createItemDialogTitle={t`Create new dimensions`}
      defaultSortByField={caseTypeId ? 'rank' : 'case_type_id'}
      defaultSortDirection={'asc'}
      tableStoreStorageNamePostFix={caseTypeId ? `CaseType` : undefined}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.DIMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DimsAdminPage')}
      title={title}
      updateOne={updateOne}
    />
  );
};
