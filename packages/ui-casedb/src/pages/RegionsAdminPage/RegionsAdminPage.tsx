import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import { useParams } from 'react-router-dom';
import type { CaseDbRegion } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbGeoApi,
} from '@gen-epix/api-casedb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

// Note: region_set_id is given in the route params
type FormFields = OmitWithMetaData<CaseDbRegion, 'region_set_id' | 'region_set'>;

export const RegionsAdminPage = () => {
  const { regionSetId } = useParams();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbGeoApi.getInstance().regionsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((regions: CaseDbRegion[]) => {
    return regions.filter((region) => region.region_set_id === regionSetId);
  }, [regionSetId]);

  const deleteOne = useCallback(async (item: CaseDbRegion) => {
    return await CaseDbGeoApi.getInstance().regionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbRegion) => {
    return (await CaseDbGeoApi.getInstance().regionsPutOne(item.id, {
      ...variables,
      id: item.id,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbGeoApi.getInstance().regionsPostOne({
      ...variables,
      region_set_id: regionSetId,
    })).data;
  }, [regionSetId]);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      center_lat: SchemaUtil.number.required(),
      center_lon: SchemaUtil.number.required(),
      centroid_lat: SchemaUtil.number.required(),
      centroid_lon: SchemaUtil.number.required(),
      code: SchemaUtil.code,
      name: SchemaUtil.name,
    });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Centroid latitude`,
        name: 'centroid_lat',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Centroid longitude`,
        name: 'centroid_lon',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Center latitude`,
        name: 'center_lat',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Center longitude`,
        name: 'center_lon',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbRegion>[] => {
    return [
      TableUtil.createTextColumn<CaseDbRegion>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<CaseDbRegion>({ id: 'code', name: t`Code` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseDbRegion): CaseDbRegion => {
    return {
      id: previousItem.id,
      region_set_id: previousItem.region_set_id,
      ...variables,
    };
  }, []);

  return (
    <CrudPage<FormFields, CaseDbRegion>
      createItemDialogTitle={t`Create new region`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.RegionCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      resourceQueryKeyBase={QUERY_KEY.REGIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionsAdminPage')}
      title={t`Regions`}
      updateOne={updateOne}
    />
  );
};
