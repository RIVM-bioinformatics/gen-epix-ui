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
import type {
  CaseDbApiPermission,
  CaseDbRegionRelation,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbGeoApi,
  CaseDbRegionRelationType,
} from '@gen-epix/api-casedb';
import type { OmitWithMetaData } from '@gen-epix/ui/models/data';
import type { TableColumn } from '@gen-epix/ui/models/table';
import { CrudPage } from '@gen-epix/ui/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { FormFieldDefinition } from '../../../../ui-core-form-components/src/models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../../ui-core-form-components/src/models/form';

import { CASEDB_QUERY_KEY } from '../../constants/query';
import {
  useRegionMapQuery,
  useRegionOptionsQuery,
} from '../../dataHooks/useRegionQuery';
import { useRegionRelationTypeOptionsQuery } from '../../dataHooks/useRegionRelationTypeQuery';


type FormFields = OmitWithMetaData<CaseDbRegionRelation, 'from_region' | 'to_region'>;

export const RegionRelationsAdminPage = () => {
  const { t } = useTranslation();

  const regionMapQuery = useRegionMapQuery();
  const regionOptionsQuery = useRegionOptionsQuery();
  const regionRelationTypeOptionsQuery = useRegionRelationTypeOptionsQuery();

  const loadables = useArray([regionOptionsQuery, regionMapQuery, regionRelationTypeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbGeoApi.getInstance().regionRelationsGetAll(null, null, { signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbRegionRelation) => {
    return await CaseDbGeoApi.getInstance().regionRelationsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbRegionRelation) => {
    return (await CaseDbGeoApi.getInstance().regionRelationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbGeoApi.getInstance().regionRelationsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbRegionRelation) => {
    const fromRegion = regionMapQuery.map.get(item.from_region_id);
    const toRegion = regionMapQuery.map.get(item.to_region_id);
    if (fromRegion && toRegion) {
      return `${fromRegion.name} -> ${toRegion.name}`;
    }
    return `${item.from_region_id} -> ${item.to_region_id}`;
  }, [regionMapQuery.map]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      from_region_id: string().uuid4().required(),
      relation: mixed<CaseDbRegionRelationType>().required().oneOf(Object.values(CaseDbRegionRelationType)),
      to_region_id: string().uuid4().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`From Region`,
        loading: regionOptionsQuery.isLoading,
        name: 'from_region_id',
        options: regionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`To Region`,
        loading: regionOptionsQuery.isLoading,
        name: 'to_region_id',
        options: regionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Relation`,
        loading: regionRelationTypeOptionsQuery.isLoading,
        name: 'relation',
        options: regionRelationTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [regionOptionsQuery.isLoading, regionOptionsQuery.options, regionRelationTypeOptionsQuery.isLoading, regionRelationTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbRegionRelation>[] => {
    return [
      TableUtil.createOptionsColumn<CaseDbRegionRelation>({ id: 'from_region_id', name: t`From Region`, options: regionOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbRegionRelation>({ id: 'to_region_id', name: t`To Region`, options: regionOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbRegionRelation>({ id: 'relation', name: t`Relation`, options: regionRelationTypeOptionsQuery.options }),
    ];
  }, [regionOptionsQuery.options, regionRelationTypeOptionsQuery.options, t]);


  return (
    <CrudPage<FormFields, CaseDbRegionRelation, CaseDbRegionRelation, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new region relation`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.RegionRelationCrudCommand}
      defaultSortByField={'from_region_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Region relation`}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.REGION_RELATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionRelationsAdminPage')}
      title={t`Region Relations`}
      updateOne={updateOne}
    />
  );
};
