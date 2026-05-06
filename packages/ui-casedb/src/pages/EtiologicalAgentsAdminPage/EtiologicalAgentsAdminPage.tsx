import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type { CaseDbEtiologicalAgent } from '@gen-epix/api-casedb';
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


type FormFields = OmitWithMetaData<CaseDbEtiologicalAgent>;

export const EtiologicalAgentsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.getInstance().etiologicalAgentsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbEtiologicalAgent) => {
    return await CaseDbOntologyApi.getInstance().etiologicalAgentsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbEtiologicalAgent) => {
    return (await CaseDbOntologyApi.getInstance().etiologicalAgentsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.getInstance().etiologicalAgentsPostOne(variables)).data;
  }, []);

  const getName = useCallback((variables: CaseDbEtiologicalAgent) => {
    return variables.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: SchemaUtil.name,
      type: string().extendedAlphaNumeric().required().max(100),
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
        label: t`Type`,
        name: 'type',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbEtiologicalAgent>[] => {
    return [
      TableUtil.createTextColumn<CaseDbEtiologicalAgent>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbEtiologicalAgent>
      createItemDialogTitle={t`Create new etiological agent`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.EtiologicalAgentCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.ETIOLOGICAL_AGENTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EtiologicalAgentsAdminPage')}
      title={t`EtiologicalAgents`}
      updateOne={updateOne}
    />
  );
};
