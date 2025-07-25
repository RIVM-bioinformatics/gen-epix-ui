import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { CaseType } from '../../api';
import {
  CaseApi,
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

type FormFields = Pick<CaseType, 'name' | 'etiological_agent_id' | 'disease_id'>;

export const CaseTypesAdminPage = () => {
  const [t] = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useMemo<Loadable[]>(() => [diseaseOptionsQuery, etiologicalAgentOptionsQuery], [etiologicalAgentOptionsQuery, diseaseOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().caseTypesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseType) => {
    return await CaseApi.getInstance().caseTypesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseType) => {
    return (await CaseApi.getInstance().caseTypesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.getInstance().caseTypesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseType) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      etiological_agent_id: string().uuid4().nullable().test(function(value: string) {
        // eslint-disable-next-line react/no-this-in-sfc
        const { disease_id } = this.parent as FormFields;
        if (value !== null || !!disease_id) {
          return true;
        }
        // eslint-disable-next-line react/no-this-in-sfc
        return this.createError({
          message: t`Etiological agent is required when no disease is selected`,
          path: 'etiological_agent_id',
        });
      }),
      disease_id: string().uuid4().nullable().test(function(value: string) {
        // eslint-disable-next-line react/no-this-in-sfc
        const { etiological_agent_id } = this.parent as FormFields;
        if (value !== null || !!etiological_agent_id) {
          return true;
        }
        // eslint-disable-next-line react/no-this-in-sfc
        return this.createError({
          message: t`Disease is required when no etiological agent is selected`,
          path: 'disease_id',
        });
      }),
    });
  }, [t]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      },
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
  }, [etiologicalAgentOptionsQuery.isLoading, etiologicalAgentOptionsQuery.options, diseaseOptionsQuery, t]);

  const tableColumns = useMemo((): TableColumn<CaseType>[] => {
    return [
      TableUtil.createTextColumn<CaseType>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<CaseType>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseType>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseType>
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypesAdminPage')}
      title={t`Case types`}
      updateOne={updateOne}
    />
  );
};
