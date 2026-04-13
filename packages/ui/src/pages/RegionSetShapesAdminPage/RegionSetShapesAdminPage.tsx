import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  number,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import type { RegionSetShape } from '@gen-epix/api-casedb';
import {
  CommandName,
  GeoApi,
} from '@gen-epix/api-casedb';

import { useRegionSetsMapQuery } from '../../dataHooks/useRegionSetsQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';

// Note: region_set_id is given in the route params
type FormFields = OmitWithMetaData<RegionSetShape, 'region_set_id' | 'region_set'>;

export const RegionSetShapesAdminPage = () => {
  const { regionSetId } = useParams();
  const { t } = useTranslation();
  const regionSetsMapQuery = useRegionSetsMapQuery();

  const loadables = useArray([regionSetsMapQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.instance.regionSetShapesGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((regionSetShapes: RegionSetShape[]) => {
    return regionSetShapes.filter((regionSetShape) => regionSetShape.region_set_id === regionSetId);
  }, [regionSetId]);

  const deleteOne = useCallback(async (item: RegionSetShape) => {
    return await GeoApi.instance.regionSetShapesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSetShape) => {
    return (await GeoApi.instance.regionSetShapesPutOne(item.id, {
      ...variables,
      id: item.id,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.instance.regionSetShapesPostOne({
      ...variables,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const getName = useCallback((item: FormFields) => {
    const regionSet = regionSetsMapQuery.map.get(regionSetId);
    return `${regionSet.name} - ${item.scale}`;
  }, [regionSetId, regionSetsMapQuery.map]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      geo_json: string().freeFormText(),
      scale: number().required().positive().transform((_val: unknown, orig: number | string) => orig === '' ? undefined : orig),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Scale`,
        name: 'scale',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Scale`,
        multiline: true,
        name: 'geo_json',
        rows: 20,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<RegionSetShape>[] => {
    return [
      TableUtil.createNumberColumn<RegionSetShape>({ id: 'scale', name: t`Scale` }),
      TableUtil.createBooleanColumn<RegionSetShape>({ id: 'geo_json', name: t`GEO JSON` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: RegionSetShape): RegionSetShape => {
    return {
      id: previousItem.id,
      region_set_id: previousItem.region_set_id,
      ...variables,
    };
  }, []);

  return (
    <CrudPage<FormFields, RegionSetShape>
      createItemDialogTitle={t`Create new region set shape`}
      createOne={createOne}
      crudCommandType={CommandName.RegionSetShapeCrudCommand}
      defaultSortByField={'scale'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.REGION_SET_SHAPES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionSetShapesAdminPage')}
      title={t`Region set shapes`}
      updateOne={updateOne}
    />
  );
};
