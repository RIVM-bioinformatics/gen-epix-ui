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

import type { RegionSet } from '../../api';
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

type FormFields = Pick<RegionSet, 'name' | 'code' | 'region_code_as_label'>;

export const RegionSetsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.getInstance().regionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RegionSet) => {
    return await GeoApi.getInstance().regionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSet) => {
    return (await GeoApi.getInstance().regionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.getInstance().regionSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RegionSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: string().code().required().max(100),
      name: string().extendedAlphaNumeric().required().max(100),
      region_code_as_label: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'region_code_as_label',
        label: t`Region code as label`,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<RegionSet>[] => {
    return [
      TableUtil.createTextColumn<RegionSet>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<RegionSet>({ id: 'code', name: t`Code` }),
      TableUtil.createBooleanColumn<RegionSet>({ id: 'region_code_as_label', name: t`Region code as label` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, RegionSet>
      createOne={createOne}
      crudCommandType={CommandName.RegionSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REGION_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionSetsAdminPage')}
      title={t`Region sets`}
      updateOne={updateOne}
    />
  );
};
