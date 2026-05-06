import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type { CaseDbApiPermission, CaseDbEtiology } from '@gen-epix/api-casedb';
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
  TableUtil,
  TestIdUtil,
  useArray,
} from '@gen-epix/ui';

import { useDiseaseOptionsQuery } from '../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentOptionsQuery } from '../../dataHooks/useEtiologicalAgentsQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';

type FormFields = OmitWithMetaData<CaseDbEtiology, 'disease' | 'etiological_agent'>;

export const EtiologiesAdminPage = () => {
  const { t } = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useArray([diseaseOptionsQuery, etiologicalAgentOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.getInstance().etiologiesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbEtiology) => {
    return await CaseDbOntologyApi.getInstance().etiologiesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbEtiology) => {
    return (await CaseDbOntologyApi.getInstance().etiologiesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.getInstance().etiologiesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbEtiology) => {
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

  const tableColumns = useMemo((): TableColumn<CaseDbEtiology>[] => {
    return [
      TableUtil.createOptionsColumn<CaseDbEtiology>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbEtiology>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseDbEtiology, CaseDbEtiology, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new etiology`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.EtiologyCrudCommand}
      defaultSortByField={'disease_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.ETIOLOGIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EtiologiesAdminPage')}
      title={t`Etiologies`}
      updateOne={updateOne}
    />
  );
};
