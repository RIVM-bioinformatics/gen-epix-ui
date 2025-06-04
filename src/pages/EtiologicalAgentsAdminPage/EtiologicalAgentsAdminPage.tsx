import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { EtiologicalAgent } from '../../api';
import {
  OntologyApi,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<EtiologicalAgent, 'name' | 'type'>;

export const EtiologicalAgentsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().etiologicalAgentsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: EtiologicalAgent) => {
    return await OntologyApi.getInstance().etiologicalAgentsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: EtiologicalAgent) => {
    return (await OntologyApi.getInstance().etiologicalAgentsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().etiologicalAgentsPostOne(variables)).data;
  }, []);

  const getName = useCallback((variables: EtiologicalAgent) => {
    return variables.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      type: string().extendedAlphaNumeric().required().max(100),
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
        name: 'type',
        label: t`Type`,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<EtiologicalAgent>[] => {
    return [
      TableUtil.createTextColumn<EtiologicalAgent>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, EtiologicalAgent>
      createOne={createOne}
      crudCommandType={CommandName.EtiologicalAgentCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.ETIOLOGICAL_AGENTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EtiologicalAgentsAdminPage')}
      title={t`EtiologicalAgents`}
      updateOne={updateOne}
    />
  );
};
