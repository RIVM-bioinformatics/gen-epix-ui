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

import type { Region } from '../../api';
import {
  GeoApi,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Omit<Region, 'id' | 'region_set_id' | 'region_set'>;

export const RegionsAdminPage = () => {
  const { regionSetId } = useParams();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.instance.regionsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((regions: Region[]) => {
    return regions.filter((region) => region.region_set_id === regionSetId);
  }, [regionSetId]);

  const deleteOne = useCallback(async (item: Region) => {
    return await GeoApi.instance.regionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Region) => {
    return (await GeoApi.instance.regionsPutOne(item.id, {
      ...variables,
      id: item.id,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.instance.regionsPostOne({
      ...variables,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      centroid_lat: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      centroid_lon: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      center_lat: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      center_lon: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
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
        name: 'centroid_lat',
        label: t`Centroid latitude`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'centroid_lon',
        label: t`Centroid longitude`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'center_lat',
        label: t`Center latitude`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'center_lon',
        label: t`Center longitude`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Region>[] => {
    return [
      TableUtil.createTextColumn<Region>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Region>({ id: 'code', name: t`Code` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Region): Region => {
    return {
      id: previousItem.id,
      region_set_id: previousItem.region_set_id,
      ...variables,
    };
  }, []);

  return (
    <CrudPage<FormFields, Region>
      createOne={createOne}
      crudCommandType={CommandName.RegionCrudCommand}
      createItemDialogTitle={t`Create new region`}
      defaultSortByField={'name'}
      fetchAllSelect={fetchAllSelect}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REGIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionsAdminPage')}
      title={t`Regions`}
      updateOne={updateOne}
    />
  );
};
