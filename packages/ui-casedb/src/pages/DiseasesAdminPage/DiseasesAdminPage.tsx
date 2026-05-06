import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type { CaseDbDisease } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOntologyApi,
} from '@gen-epix/api-casedb';
import type {
  FormFieldDefinition,
  OmitWithMetaData,
  TableColumn,
} from '@gen-epix/ui';
import {
  CrudPage,
  FORM_FIELD_DEFINITION_TYPE,
  SchemaUtil,
  TableUtil,
  TestIdUtil,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


type FormFields = OmitWithMetaData<CaseDbDisease>;

export const DiseasesAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.getInstance().diseasesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbDisease) => {
    return await CaseDbOntologyApi.getInstance().diseasesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDisease) => {
    return (await CaseDbOntologyApi.getInstance().diseasesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.getInstance().diseasesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbDisease) => {
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

  const tableColumns = useMemo((): TableColumn<CaseDbDisease>[] => {
    return [
      TableUtil.createTextColumn<CaseDbDisease>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<CaseDbDisease>({ id: 'icd_code', name: t`ICD Code` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbDisease>
      createItemDialogTitle={t`Create new disease`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.DiseaseCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.DISEASES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DiseasesAdminPage')}
      title={t`Diseases`}
      updateOne={updateOne}
    />
  );
};
