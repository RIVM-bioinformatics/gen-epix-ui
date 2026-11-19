import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbLocusSetInput,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
} from '@gen-epix/api-seqdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { useLocusOptionsQuery } from '../../dataHooks/useLociQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbLocusSetInput>;
type SeqDbLocusSetWithId = { id: string } & SeqDbLocusSetInput;
type TableData = { loci_display: string } & SeqDbLocusSetWithId;

const isLocusSetWithId = (locusSet: SeqDbLocusSetInput): locusSet is SeqDbLocusSetWithId => {
  return typeof locusSet.id === 'string' && locusSet.id.length > 0;
};

const requireLocusSetId = (locusSet: SeqDbLocusSetInput): SeqDbLocusSetWithId => {
  if (!isLocusSetWithId(locusSet)) {
    throw new Error('SeqDB returned a locus set without an ID.');
  }

  return locusSet;
};

export const LocusSetsAdminPage = () => {
  const { t } = useTranslation();
  const locusOptionsQuery = useLocusOptionsQuery();
  const loadables = useArray([locusOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).locusSetsGetAll(null, null, { signal });
    return response.data.map(requireLocusSetId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return requireLocusSetId((await container.resolve(SeqDbSeqApi).locusSetsPostOne(variables)).data);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbLocusSetWithId) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      locus_ids: array().of(string().required()).required(),
      name: SchemaUtil.name,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        label: t`Loci`,
        loading: locusOptionsQuery.isLoading,
        name: 'locus_ids',
        options: locusOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [locusOptionsQuery.isLoading, locusOptionsQuery.options, t]);

  const locusLabelsById = useMemo(() => {
    return new Map(locusOptionsQuery.options.map(option => [option.value, option.label ?? option.value]));
  }, [locusOptionsQuery.options]);

  const convertToTableData = useCallback((items: SeqDbLocusSetWithId[]): TableData[] => {
    return items.map(item => ({
      ...item,
      loci_display: item.locus_ids.map(locusId => locusLabelsById.get(locusId) ?? locusId).join(', '),
    }));
  }, [locusLabelsById]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<TableData>({ flex: 2, id: 'loci_display', name: t`Loci` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbLocusSetWithId, TableData, SEQDB_QUERY_KEY, SeqDbApiPermission>
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new locus set`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.LocusSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Locus set`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.LOCUS_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('LocusSetsAdminPage')}
      title={t`Locus sets`}
    />
  );
};
