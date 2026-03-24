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

import type { RegionRelation } from '../../api';
import {
  CommandName,
  RegionRelationType,
  GeoApi,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { useArray } from '../../hooks/useArray';
import {
  useRegionMapQuery,
  useRegionOptionsQuery,
} from '../../dataHooks/useRegionQuery';
import { useRegionRelationTypeOptionsQuery } from '../../dataHooks/useRegionRelationTypeQuery';


type FormFields = Omit<RegionRelation, 'id' | 'from_region' | 'to_region'>;

export const RegionRelationsAdminPage = () => {
  const { t } = useTranslation();

  const regionMapQuery = useRegionMapQuery();
  const regionOptionsQuery = useRegionOptionsQuery();
  const regionRelationTypeOptionsQuery = useRegionRelationTypeOptionsQuery();

  const loadables = useArray([regionOptionsQuery, regionMapQuery, regionRelationTypeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.instance.regionRelationsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RegionRelation) => {
    return await GeoApi.instance.regionRelationsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionRelation) => {
    return (await GeoApi.instance.regionRelationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.instance.regionRelationsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RegionRelation) => {
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
      to_region_id: string().uuid4().required(),
      relation: mixed<RegionRelationType>().required().oneOf(Object.values(RegionRelationType)),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'from_region_id',
        label: t`From Region`,
        options: regionOptionsQuery.options,
        loading: regionOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'to_region_id',
        label: t`To Region`,
        options: regionOptionsQuery.options,
        loading: regionOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'relation',
        label: t`Relation`,
        options: regionRelationTypeOptionsQuery.options,
        loading: regionRelationTypeOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [regionOptionsQuery.isLoading, regionOptionsQuery.options, regionRelationTypeOptionsQuery.isLoading, regionRelationTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<RegionRelation>[] => {
    return [
      TableUtil.createOptionsColumn<RegionRelation>({ id: 'from_region_id', name: t`From Region`, options: regionOptionsQuery.options }),
      TableUtil.createOptionsColumn<RegionRelation>({ id: 'to_region_id', name: t`To Region`, options: regionOptionsQuery.options }),
      TableUtil.createOptionsColumn<RegionRelation>({ id: 'relation', name: t`Relation`, options: regionRelationTypeOptionsQuery.options }),
    ];
  }, [regionOptionsQuery.options, regionRelationTypeOptionsQuery.options, t]);


  return (
    <CrudPage<FormFields, RegionRelation>
      createOne={createOne}
      crudCommandType={CommandName.RegionRelationCrudCommand}
      createItemDialogTitle={t`Create new region relation`}
      defaultSortByField={'from_region_id'}
      loadables={loadables}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REGION_RELATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionRelationsAdminPage')}
      title={t`Region Relations`}
      updateOne={updateOne}
    />
  );
};
