import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  mixed,
  number,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbProtocol,
  SeqDbProtocolType,
  SeqDbSeqDistanceType,
  SeqDbSeqProfileType,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbProtocolType as SeqDbProtocolTypeValues,
  SeqDbSeqApi,
  SeqDbSeqDistanceType as SeqDbSeqDistanceTypeValues,
  SeqDbSeqProfileType as SeqDbSeqProfileTypeValues,
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

import { useLocusSetOptionsQuery } from '../../dataHooks/useLocusSetsQuery';
import { useProtocolTypeOptionsQuery } from '../../dataHooks/useProtocolTypeOptionsQuery';
import { useRefSeqOptionsQuery } from '../../dataHooks/useRefSeqsQuery';
import { useSeqCategorySetOptionsQuery } from '../../dataHooks/useSeqCategorySetsQuery';
import { useSeqDistanceTypeOptionsQuery } from '../../dataHooks/useSeqDistanceTypeOptionsQuery';
import { useSeqProfileTypeOptionsQuery } from '../../dataHooks/useSeqProfileTypeOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = {
  propsJson: string;
} & OmitWithMetaData<SeqDbProtocol, 'props'>;

const parsePropsJson = (propsJson: string): NonNullable<SeqDbProtocol['props']> => {
  const parsedProps: unknown = JSON.parse(propsJson);
  if (typeof parsedProps !== 'object' || parsedProps === null || Array.isArray(parsedProps)) {
    throw new Error('Protocol properties must be a JSON object.');
  }

  return parsedProps;
};

export const ProtocolsAdminPage = () => {
  const { t } = useTranslation();
  const locusSetOptionsQuery = useLocusSetOptionsQuery();
  const protocolTypeOptionsQuery = useProtocolTypeOptionsQuery();
  const refSeqOptionsQuery = useRefSeqOptionsQuery();
  const seqCategorySetOptionsQuery = useSeqCategorySetOptionsQuery();
  const seqDistanceTypeOptionsQuery = useSeqDistanceTypeOptionsQuery();
  const seqProfileTypeOptionsQuery = useSeqProfileTypeOptionsQuery();
  const loadables = useArray([
    locusSetOptionsQuery,
    protocolTypeOptionsQuery,
    refSeqOptionsQuery,
    seqCategorySetOptionsQuery,
    seqDistanceTypeOptionsQuery,
    seqProfileTypeOptionsQuery,
  ]);
  const defaultNewItem = useMemo<Partial<FormFields>>(() => ({ propsJson: '{}' }), []);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).protocolsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const { propsJson, ...protocol } = variables;
    return (await container.resolve(SeqDbSeqApi).protocolsPostOne({
      ...protocol,
      props: parsePropsJson(propsJson),
    })).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbProtocol) => {
    if (!item.id) {
      throw new Error('Cannot update a protocol without an ID.');
    }

    const { propsJson, ...protocol } = variables;
    return (await container.resolve(SeqDbSeqApi).protocolsPutOne(item.id, {
      ...protocol,
      id: item.id,
      props: parsePropsJson(propsJson),
    })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbProtocol) => {
    if (!item.id) {
      throw new Error('Cannot delete a protocol without an ID.');
    }

    return container.resolve(SeqDbSeqApi).protocolsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbProtocol) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const getFormValuesFromItem = useCallback((item: SeqDbProtocol): Partial<FormFields> => {
    return {
      ...item,
      propsJson: JSON.stringify(item.props ?? {}, null, 2),
    };
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      description: string().nullable().optional().max(1000),
      git_commit_hash: string().nullable().optional(),
      git_commit_tag: string().nullable().optional(),
      git_repository_uri: string().nullable().optional(),
      is_integer_distance: boolean().nullable().optional(),
      locus_set_id: string().nullable().optional(),
      max_stored_distance: number().nullable().optional(),
      name: string().nullable().optional().max(100),
      propsJson: string().required().test('valid-json-object', t`Enter a valid JSON object.`, (value) => {
        if (value === undefined) {
          return false;
        }

        try {
          const parsedProps: unknown = JSON.parse(value);
          return typeof parsedProps === 'object' && parsedProps !== null && !Array.isArray(parsedProps);
        } catch {
          return false;
        }
      }),
      protocol_type: mixed<SeqDbProtocolType>().oneOf(Object.values(SeqDbProtocolTypeValues)).required(),
      ref_seq_id: string().nullable().optional(),
      seq_category_set_id: string().nullable().optional(),
      seq_distance_type: mixed<SeqDbSeqDistanceType>().oneOf(Object.values(SeqDbSeqDistanceTypeValues)).nullable().optional(),
      seq_profile_type: mixed<SeqDbSeqProfileType>().oneOf(Object.values(SeqDbSeqProfileTypeValues)).nullable().optional(),
      valid_end_datetime: string().datetime().nullable().optional(),
      valid_start_datetime: string().datetime().nullable().optional(),
    });
  }, [t]);

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
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 4,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Protocol type`,
        name: 'protocol_type',
        options: protocolTypeOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Reference sequence`,
        loading: refSeqOptionsQuery.isLoading,
        name: 'ref_seq_id',
        options: refSeqOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Sequence category set`,
        loading: seqCategorySetOptionsQuery.isLoading,
        name: 'seq_category_set_id',
        options: seqCategorySetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Locus set`,
        loading: locusSetOptionsQuery.isLoading,
        name: 'locus_set_id',
        options: locusSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Sequence profile type`,
        name: 'seq_profile_type',
        options: seqProfileTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Sequence distance type`,
        name: 'seq_distance_type',
        options: seqDistanceTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
        label: t`Integer distance`,
        name: 'is_integer_distance',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Maximum stored distance`,
        name: 'max_stored_distance',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Git repository URI`,
        name: 'git_repository_uri',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Git commit hash`,
        name: 'git_commit_hash',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Git commit tag`,
        name: 'git_commit_tag',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Valid start datetime`,
        name: 'valid_start_datetime',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Valid end datetime`,
        name: 'valid_end_datetime',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Additional properties (JSON object)`,
        multiline: true,
        name: 'propsJson',
        required: true,
        rows: 8,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [
    locusSetOptionsQuery.isLoading,
    locusSetOptionsQuery.options,
    protocolTypeOptionsQuery.options,
    refSeqOptionsQuery.isLoading,
    refSeqOptionsQuery.options,
    seqCategorySetOptionsQuery.isLoading,
    seqCategorySetOptionsQuery.options,
    seqDistanceTypeOptionsQuery.options,
    seqProfileTypeOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbProtocol>[] => {
    return [
      TableUtil.createTextColumn<SeqDbProtocol>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbProtocol>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<SeqDbProtocol>({ id: 'protocol_type', name: t`Protocol type`, options: protocolTypeOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbProtocol>({ id: 'seq_category_set_id', name: t`Sequence category set`, options: seqCategorySetOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbProtocol>({ id: 'locus_set_id', name: t`Locus set`, options: locusSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbProtocol>({ id: 'seq_profile_type', name: t`Sequence profile type`, options: seqProfileTypeOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbProtocol>({ id: 'seq_distance_type', name: t`Sequence distance type`, options: seqDistanceTypeOptionsQuery.options }),
    ];
  }, [
    locusSetOptionsQuery.options,
    protocolTypeOptionsQuery.options,
    seqCategorySetOptionsQuery.options,
    seqDistanceTypeOptionsQuery.options,
    seqProfileTypeOptionsQuery.options,
    t,
  ]);

  return (
    <CrudPage<FormFields, SeqDbProtocol, SeqDbProtocol, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new protocol`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.ProtocolCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getFormValuesFromItem={getFormValuesFromItem}
      getName={getName}
      itemName={t`Protocol`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.PROTOCOLS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ProtocolsAdminPage')}
      title={t`Protocols`}
      updateOne={updateOne}
    />
  );
};
