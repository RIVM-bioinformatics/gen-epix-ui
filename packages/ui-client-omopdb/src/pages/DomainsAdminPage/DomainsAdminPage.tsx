import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type {
  OmopDbApiPermission,
  OmopDbDomain,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbOmopApi,
} from '@gen-epix/api-omopdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';

type FormFields = OmitWithMetaData<OmopDbDomain, 'domain_id'>;
type Row = { id: string } & OmopDbDomain;
const toTableRow = (item: OmopDbDomain): Row => {
  return OmopDbAdminUtil.withId(item, 'domain_id', 'Domain');
};
export const DomainsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).domainsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).domainsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'domain_id', 'Domain'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'domain_id', 'Domain');
    const response = await container.resolve(OmopDbOmopApi).domainsPutOne(id, { ...variables, domain_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).domainsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const domainName = item.domain_name;
    if (typeof domainName === 'string' && domainName.trim().length > 0) {
      return domainName;
    }
    if (typeof domainName === 'number') {
      return String(domainName);
    }
    const domainStrId = item.domain_str_id;
    if (typeof domainStrId === 'string' && domainStrId.trim().length > 0) {
      return domainStrId;
    }
    if (typeof domainStrId === 'number') {
      return String(domainStrId);
    }
    const domainConceptId = item.domain_concept_id;
    if (typeof domainConceptId === 'string' && domainConceptId.length > 0) {
      const domainConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === domainConceptId);
      if (domainConceptIdOption?.label) {
        return domainConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = domainConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New domain`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      domain_concept_id: string().required(),
      domain_name: string().required(),
      domain_str_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Domain Str ID`, name: 'domain_str_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Domain Name`, name: 'domain_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Domain Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'domain_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'domain_str_id', name: t`Domain Str ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'domain_name', name: t`Domain Name` }),
      TableUtil.createOptionsColumn<Row>({ id: 'domain_concept_id', name: t`Domain Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new domain`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DomainCrudCommand}
      defaultSortByField={'domain_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Domain`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DOMAINS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DomainsAdminPage')}
      title={t`Domains`}
      updateOne={updateOne}
    />
  );
};
