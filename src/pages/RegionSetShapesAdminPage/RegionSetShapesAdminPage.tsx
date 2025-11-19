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

import type { RegionSetShape } from '../../api';
import {
  GeoApi,
  CommandName,
} from '../../api';
import { useRegionSetsMapQuery } from '../../dataHooks/useRegionSetsQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Omit<RegionSetShape, 'id' | 'region_set_id' | 'region_set'>;

export const RegionSetShapesAdminPage = () => {
  const { regionSetId } = useParams();
  const [t] = useTranslation();
  const regionSetsMapQuery = useRegionSetsMapQuery();

  const loadables = useArray([regionSetsMapQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.getInstance().regionSetShapesGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((regionSetShapes: RegionSetShape[]) => {
    return regionSetShapes.filter((regionSetShape) => regionSetShape.region_set_id === regionSetId);
  }, [regionSetId]);

  const deleteOne = useCallback(async (item: RegionSetShape) => {
    return await GeoApi.getInstance().regionSetShapesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSetShape) => {
    return (await GeoApi.getInstance().regionSetShapesPutOne(item.id, {
      ...variables,
      id: item.id,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.getInstance().regionSetShapesPostOne({
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
      region_set_id: string().uuid4().required(),
      scale: number().required().positive().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      geo_json: string().freeFormText(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'scale',
        label: t`Scale`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'geo_json',
        label: t`Scale`,
        rows: 20,
        multiline: true,
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
      createOne={createOne}
      crudCommandType={CommandName.RegionSetShapeCrudCommand}
      createItemDialogTitle={t`Create new region set shape`}
      defaultSortByField={'scale'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
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
