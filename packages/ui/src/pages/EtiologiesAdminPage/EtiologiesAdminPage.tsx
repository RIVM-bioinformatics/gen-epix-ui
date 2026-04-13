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
  CommandName,
  OntologyApi,
} from '../../api';
import { useDiseaseOptionsQuery } from '../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentOptionsQuery } from '../../dataHooks/useEtiologicalAgentsQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<Etiology, 'disease' | 'etiological_agent'>;

export const EtiologiesAdminPage = () => {
  const { t } = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useArray([diseaseOptionsQuery, etiologicalAgentOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.instance.etiologiesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Etiology) => {
    return await OntologyApi.instance.etiologiesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Etiology) => {
    return (await OntologyApi.instance.etiologiesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.instance.etiologiesPostOne(variables)).data;
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
        label: t`Disease`,
        loading: diseaseOptionsQuery.isLoading,
        name: 'disease_id',
        options: diseaseOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Etiological agent`,
        loading: etiologicalAgentOptionsQuery.isLoading,
        name: 'etiological_agent_id',
        options: etiologicalAgentOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [etiologicalAgentOptionsQuery.isLoading, etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.isLoading, diseaseOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Etiology>[] => {
    return [
      TableUtil.createOptionsColumn<Etiology>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<Etiology>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, Etiology>
      createItemDialogTitle={t`Create new etiology`}
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
