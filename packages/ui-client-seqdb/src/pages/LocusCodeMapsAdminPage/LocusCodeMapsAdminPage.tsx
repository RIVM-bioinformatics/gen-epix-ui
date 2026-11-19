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
  SeqDbApiPermission,
  SeqDbLocusCodeMap,
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

type FormFields = { code_map_json: string } & OmitWithMetaData<SeqDbLocusCodeMap, 'code_map'>;
type SeqDbLocusCodeMapWithId = { id: string } & SeqDbLocusCodeMap;
type TableData = { code_map_display: string } & SeqDbLocusCodeMapWithId;

const isLocusCodeMapWithId = (locusCodeMap: SeqDbLocusCodeMap): locusCodeMap is SeqDbLocusCodeMapWithId => {
  return typeof locusCodeMap.id === 'string' && locusCodeMap.id.length > 0;
};

const requireLocusCodeMapId = (locusCodeMap: SeqDbLocusCodeMap): SeqDbLocusCodeMapWithId => {
  if (!isLocusCodeMapWithId(locusCodeMap)) {
    throw new Error('SeqDB returned a locus code map without an ID.');
  }

  return locusCodeMap;
};

const isStringRecord = (value: unknown): value is Record<string, string> => {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).every(key => typeof (value as Record<string, unknown>)[key] === 'string');
};

const parseCodeMapJson = (codeMapJson: string): Record<string, string> => {
  const parsed: unknown = JSON.parse(codeMapJson);
  if (!isStringRecord(parsed) || Object.entries(parsed).some(([code, locusId]) => code.length > 255 || !locusId)) {
    throw new Error('Invalid locus code map.');
  }

  return parsed;
};

export const LocusCodeMapsAdminPage = () => {
  const { t } = useTranslation();
  const locusOptionsQuery = useLocusOptionsQuery();
  const loadables = useArray([locusOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).locusCodeMapsGetAll(null, null, { signal });
    return response.data.map(requireLocusCodeMapId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const { code_map_json: codeMapJson, ...writableFields } = variables;
    const response = await container.resolve(SeqDbSeqApi).locusCodeMapsPostOne({
      ...writableFields,
      code_map: parseCodeMapJson(codeMapJson),
    });
    return requireLocusCodeMapId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbLocusCodeMapWithId) => {
    const { code_map_json: codeMapJson, ...writableFields } = variables;
    const response = await container.resolve(SeqDbSeqApi).locusCodeMapsPutOne(item.id, {
      ...writableFields,
      code_map: parseCodeMapJson(codeMapJson),
      id: item.id,
    });
    return requireLocusCodeMapId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbLocusCodeMapWithId) => {
    return (await container.resolve(SeqDbSeqApi).locusCodeMapsDeleteOne(item.id)).data;
  }, []);

  const getName = useCallback((item: FormFields | SeqDbLocusCodeMapWithId) => {
    return item.code || ('id' in item && item.id) || '';
  }, []);

  const locusIds = useMemo(() => new Set(locusOptionsQuery.options.map(option => option.value)), [locusOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      code_map_json: string()
        .required()
        .test(
          'valid-code-map',
          t`Enter a valid JSON object mapping codes to locus IDs`,
          value => {
            if (!value) {
              return false;
            }

            try {
              const parsed: unknown = JSON.parse(value);
              return isStringRecord(parsed) && !Object.entries(parsed).some(([code, locusId]) => code.length > 255 || !locusIds.has(locusId));
            } catch {
              return false;
            }
          },
        ),
    });
  }, [locusIds, t]);

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
        label: t`Locus code mappings (JSON)`,
        multiline: true,
        name: 'code_map_json',
        required: true,
        rows: 10,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => ({
    code_map_json: '{}',
  }), []);

  const getFormValuesFromItem = useCallback((item: SeqDbLocusCodeMapWithId): Partial<FormFields> => ({
    code_map_json: JSON.stringify(item.code_map, null, 2),
  }), []);

  const locusLabelsById = useMemo(() => {
    return new Map(locusOptionsQuery.options.map(option => [option.value, option.label ?? option.value]));
  }, [locusOptionsQuery.options]);

  const convertToTableData = useCallback((items: SeqDbLocusCodeMapWithId[]): TableData[] => {
    return items.map(item => ({
      ...item,
      code_map_display: Object.entries(item.code_map)
        .map(([code, locusId]) => `${code}: ${locusLabelsById.get(locusId) ?? locusId}`)
        .join('; '),
    }));
  }, [locusLabelsById]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<TableData>({ flex: 2, id: 'code_map_display', name: t`Locus code mappings` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbLocusCodeMapWithId, TableData, SEQDB_QUERY_KEY, SeqDbApiPermission>
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new locus code map`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.LocusCodeMapCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getFormValuesFromItem={getFormValuesFromItem}
      getName={getName}
      itemName={t`Locus code map`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.LOCUS_CODE_MAPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('LocusCodeMapsAdminPage')}
      title={t`Locus code maps`}
      updateOne={updateOne}
    />
  );
};
