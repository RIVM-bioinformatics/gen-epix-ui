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
import type { CaseDbDim } from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

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

type FormFields = OmitWithMetaData<CaseDbDim, 'case_type' | 'ref_dim'>;

export const DimsAdminPage = () => {
  const { caseTypeId } = useParams();
  const { t } = useTranslation();
  const refDimOptionsQuery = useRefDimOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const loadables = useArray([caseTypeOptionsQuery, refDimOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().dimsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((dims: CaseDbDim[]) => {
    if (caseTypeId) {
      return dims.filter((dim) => dim.case_type_id === caseTypeId);
    }
    return dims;
  }, [caseTypeId]);

  const deleteOne = useCallback(async (item: CaseDbDim) => {
    return await CaseDbCaseApi.getInstance().dimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDim) => {
    return (await CaseDbCaseApi.getInstance().dimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().dimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbDim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      case_type_id: string().uuid4().required().max(100),
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      is_case_date_dim: boolean().required(),
      label: SchemaUtil.label,
      occurrence: SchemaUtil.number.required().min(0).integer().positive(),
      rank: SchemaUtil.rank,
      ref_dim_id: string().uuid4().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Case type`,
        name: 'case_type_id',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Reference dimension`,
        name: 'ref_dim_id',
        options: refDimOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Label`,
        name: 'label',
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
        label: t`Occurrence`,
        name: 'occurrence',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [caseTypeOptionsQuery.options, refDimOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbDim>[] => {
    const columns: TableColumn<CaseDbDim>[] = [];

    if (!caseTypeId) {
      columns.push(
        TableUtil.createOptionsColumn<CaseDbDim>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createOptionsColumn<CaseDbDim>({ id: 'ref_dim_id', name: t`Reference dimension`, options: refDimOptionsQuery.options }),
      TableUtil.createTextColumn<CaseDbDim>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<CaseDbDim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<CaseDbDim>({ id: 'occurrence', name: t`Occurrence` }),
      TableUtil.createNumberColumn<CaseDbDim>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [caseTypeId, caseTypeOptionsQuery.options, refDimOptionsQuery.options, t]);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      case_type_id: caseTypeId ?? null,
    };
  }, [caseTypeId]);

  const subPages = useMemo<CrudPageSubPage<CaseDbDim>[]>(() => {
    if (!AuthorizationManager.getInstance().doesUserHavePermission([
      { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbDim) => caseTypeId ? `/management/case-types/${caseTypeId}/dimensions/${item.id}/columns` : `/management/dimensions/${item.id}/columns`,
        label: t`Manage columns`,
      } satisfies CrudPageSubPage<CaseDbDim>,
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
    <CrudPage<FormFields, CaseDbDim>
      createItemDialogTitle={t`Create new dimensions`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.DimCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={caseTypeId ? 'rank' : 'case_type_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.DIMS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      tableStoreStorageNamePostFix={caseTypeId ? `CaseType` : undefined}
      testIdAttributes={TestIdUtil.createAttributes('DimsAdminPage')}
      title={title}
      updateOne={updateOne}
    />
  );
};
