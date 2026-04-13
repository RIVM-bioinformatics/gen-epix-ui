import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type { Disease } from '@gen-epix/api-casedb';
import {
  CommandName,
  OntologyApi,
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

type FormFields = OmitWithMetaData<Disease>;

export const DiseasesAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.instance.diseasesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Disease) => {
    return await OntologyApi.instance.diseasesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Disease) => {
    return (await OntologyApi.instance.diseasesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.instance.diseasesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Disease) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      icd_code: string().alphaNumeric().nullable().max(100),
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
        label: t`ICD Code`,
        name: 'icd_code',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Disease>[] => {
    return [
      TableUtil.createTextColumn<Disease>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Disease>({ id: 'icd_code', name: t`ICD Code` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, Disease>
      createItemDialogTitle={t`Create new disease`}
      createOne={createOne}
      crudCommandType={CommandName.DiseaseCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.DISEASES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DiseasesAdminPage')}
      title={t`Diseases`}
      updateOne={updateOne}
    />
  );
};
