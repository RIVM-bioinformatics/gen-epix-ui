import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { Etiology } from '../../api';
import {
  OntologyApi,
  CommandName,
} from '../../api';
import { useDiseaseOptionsQuery } from '../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentOptionsQuery } from '../../dataHooks/useEtiologicalAgentsQuery';
import type { Loadable } from '../../models/dataHooks';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<Etiology, 'disease_id' | 'etiological_agent_id'>;

export const EtiologiesAdminPage = () => {
  const [t] = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useMemo<Loadable[]>(() => [diseaseOptionsQuery, etiologicalAgentOptionsQuery], [etiologicalAgentOptionsQuery, diseaseOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().etiologiesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Etiology) => {
    return await OntologyApi.getInstance().etiologiesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Etiology) => {
    return (await OntologyApi.getInstance().etiologiesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().etiologiesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Etiology) => {
    return item.id;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      disease_id: string().uuid4().required(),
      etiological_agent_id: string().uuid4().required(),
    });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'disease_id',
        label: t`Disease`,
        options: diseaseOptionsQuery.options,
        loading: diseaseOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'etiological_agent_id',
        label: t`Etiological agent`,
        options: etiologicalAgentOptionsQuery.options,
        loading: etiologicalAgentOptionsQuery.isLoading,
      },
    ];
  }, [etiologicalAgentOptionsQuery.isLoading, etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.isLoading, diseaseOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Etiology>[] => {
    return [
      TableUtil.createOptionsColumn<Etiology>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<Etiology>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, Etiology>
      createOne={createOne}
      crudCommandType={CommandName.EtiologyCrudCommand}
      defaultSortByField={'disease_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ETIOLOGIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EtiologiesAdminPage')}
      title={t`Etiologies`}
      updateOne={updateOne}
    />
  );
};
