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

import type { RegionSetShape } from '../../api';
import {
  GeoApi,
  CommandName,
} from '../../api';
import {
  useRegionSetOptionsQuery,
  useRegionSetsMapQuery,
} from '../../dataHooks/useRegionSetsQuery';
import type { Loadable } from '../../models/dataHooks';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<RegionSetShape, 'region_set_id' | 'scale' | 'geo_json'>;

export const RegionSetShapesAdminPage = () => {
  const [t] = useTranslation();
  const regionSetOptionsQuery = useRegionSetOptionsQuery();
  const regionSetsMapQuery = useRegionSetsMapQuery();

  const loadables = useMemo<Loadable[]>(() => [regionSetOptionsQuery, regionSetsMapQuery], [regionSetOptionsQuery, regionSetsMapQuery]);


  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.getInstance().regionSetShapesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RegionSetShape) => {
    return await GeoApi.getInstance().regionSetShapesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSetShape) => {
    return (await GeoApi.getInstance().regionSetShapesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.getInstance().regionSetShapesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RegionSetShape) => {
    const regionSet = regionSetsMapQuery.map.get(item.region_set_id);
    return `${regionSet.name} - ${item.scale}`;
  }, [regionSetsMapQuery.map]);

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
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'region_set_id',
        label: t`Region set`,
        options: regionSetOptionsQuery.options,
        loading: regionSetOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'scale',
        label: t`Scale`,
        type: 'number',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'geo_json',
        label: t`Scale`,
        rows: 20,
        multiline: true,
      },
    ];
  }, [regionSetOptionsQuery.isLoading, regionSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<RegionSetShape>[] => {
    return [
      TableUtil.createOptionsColumn<RegionSetShape>({ id: 'region_set_id', name: t`Region set`, options: regionSetOptionsQuery.options }),
      TableUtil.createNumberColumn<RegionSetShape>({ id: 'scale', name: t`Scale` }),
      TableUtil.createBooleanColumn<RegionSetShape>({ id: 'geo_json', name: t`GEO JSON` }),
    ];
  }, [regionSetOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, RegionSetShape>
      createOne={createOne}
      crudCommandType={CommandName.RegionSetShapeCrudCommand}
      defaultSortByField={'region_set_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
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
