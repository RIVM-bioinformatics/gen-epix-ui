import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import i18next from 'i18next';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbDim,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRefDim,
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { DataService } from '../../classes/services/DataService';

import { CaseTypeFormUtil } from './CaseTypeFormUtil';

type ColumnSpecification = {
  readonly col: CaseDbCol;
  readonly dimId: string;
  readonly refCol: CaseDbRefCol;
};

const createFixture = () => {
  const columns: ColumnSpecification[] = [];
  const addColumn = (id: string, colType: CaseDbColType, dimId: string, pattern?: string): void => {
    const refDimId = dimId.replace('dimension-', 'ref-dimension-');
    const refColId = `ref-${id}`;
    const isConceptCol = new Set<CaseDbColType>([CaseDbColType.INTERVAL, CaseDbColType.NOMINAL, CaseDbColType.ORDINAL]).has(colType);
    const refCol: CaseDbRefCol = {
      code: id,
      col_type: colType,
      ...(isConceptCol ? { concept_set_id: 'concept-set-1' } : {}),
      ...(colType === CaseDbColType.GEO_REGION ? { region_set_id: 'region-set-1' } : {}),
      ref_dim_id: refDimId,
    };
    const col = {
      case_type_id: 'case-type-1',
      code: id,
      dim_id: dimId,
      id,
      label: id,
      pattern,
      rank: 1,
      ref_col_id: refColId,
    } as CaseDbCol;
    columns.push({ col, dimId, refCol });
  };

  Object.values(CaseDbColType).forEach((colType) => {
    let dimId = 'dimension-other';
    if (colType === CaseDbColType.GEO_REGION) {
      dimId = 'dimension-geo';
    } else if (colType === CaseDbColType.TIME_DAY) {
      dimId = 'dimension-time';
    } else if (colType === CaseDbColType.DECIMAL_0 || colType === CaseDbColType.INTERVAL) {
      dimId = 'dimension-mixed';
    }
    addColumn(
      `col-${colType}`,
      colType,
      dimId,
      colType === CaseDbColType.REGULAR_LANGUAGE ? '^[A-Z]+$' : undefined,
    );
  });
  addColumn('col-REGULAR_LANGUAGE-invalid', CaseDbColType.REGULAR_LANGUAGE, 'dimension-other', '[');
  addColumn('col-no-write', CaseDbColType.TEXT, 'dimension-other');

  const dims: CaseDbDim[] = [
    { case_type_id: 'case-type-1', code: 'geo', id: 'dimension-geo', label: 'Geography', rank: 1, ref_dim_id: 'ref-dimension-geo' },
    { case_type_id: 'case-type-1', code: 'time', id: 'dimension-time', label: 'Time', rank: 2, ref_dim_id: 'ref-dimension-time' },
    { case_type_id: 'case-type-1', code: 'mixed', id: 'dimension-mixed', label: 'Mixed', rank: 3, ref_dim_id: 'ref-dimension-mixed' },
    { case_type_id: 'case-type-1', code: 'other', id: 'dimension-other', label: 'Other', rank: 4, ref_dim_id: 'ref-dimension-other' },
  ];
  const refDims: CaseDbRefDim[] = [
    { code: 'geo', dim_type: CaseDbDimType.GEO, id: 'ref-dimension-geo', label: 'Geography' },
    { code: 'time', dim_type: CaseDbDimType.TIME, id: 'ref-dimension-time', label: 'Time' },
    { code: 'mixed', dim_type: CaseDbDimType.NUMBER, id: 'ref-dimension-mixed', label: 'Mixed' },
    { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dimension-other', label: 'Other' },
  ];
  const colIdsByDim = Object.fromEntries(dims.map(dim => [
    dim.id,
    columns.filter(entry => entry.dimId === dim.id).map(entry => entry.col.id),
  ]));
  const colIds = columns.map(entry => entry.col.id);
  const writableColIds = colIds.filter(colId => colId !== 'col-no-write');
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: 'case-type-1',
    data_collection_id: 'data-collection-1',
    is_private: false,
    read_case_set: false,
    read_col_ids: [],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: writableColIds,
  };
  const completeCaseType = {
    case_date_dim_id: null,
    case_type_access_abacs: { 'data-collection-1': access },
    case_type_share_abacs: {},
    cols: Object.fromEntries(columns.map(({ col }) => [col.id, col])),
    dims: Object.fromEntries(dims.map(dim => [dim.id, dim])),
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: 'case-type-1',
    name: 'Case type one',
    ordered_col_ids: colIds,
    ordered_col_ids_by_dim: colIdsByDim,
    ordered_dim_ids: dims.map(dim => dim.id),
    ref_cols: Object.fromEntries(columns.map(({ col, refCol }) => [col.ref_col_id, refCol])),
    ref_dims: Object.fromEntries(refDims.map(refDim => [refDim.id, refDim])),
    tree_algorithms: {},
    user_id: null,
  } as unknown as CaseDbCompleteCaseType;

  return {
    columns,
    completeCaseType,
    dims,
    refDims,
  };
};

const configureDataService = (includeLookupData = true, regionCodeAsLabel = false): void => {
  const data = {
    conceptsBySetId: includeLookupData ? {
      'concept-set-1': [{ code: 'concept-1', concept_set_id: 'concept-set-1', id: 'concept-1', name: 'Concept one' } as CaseDbConcept],
    } : {},
    organizations: includeLookupData ? [
      { code: 'org-2', id: 'org-2', name: 'Organization one' },
      { code: 'org-1', id: 'org-1', name: 'Alpha organization' },
    ] as CaseDbOrganization[] : [],
    regionsByRegionSetId: includeLookupData ? {
      'region-set-1': [
        { code: 'R1', id: 'region-1', name: 'Region one' } as CaseDbRegion,
      ],
    } : {},
    regionSets: includeLookupData ? {
      'region-set-1': { code: 'region-set-1', id: 'region-set-1', name: 'Region set', region_code_as_label: regionCodeAsLabel, resolution: 1 } as CaseDbRegionSet,
    } : {},
  };
  container.registerInstance(DataService, { data } as unknown as DataService);
};

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Clear all {{dimension}} fields': 'Clear all {{dimension}} fields',
          'This dimension contains a mix of ordinal/interval and decimal columns. When making updates, first clear all values and only fill in the highest known resolution(s) of the data (typically the decimal data).': 'This dimension contains mixed numeric columns.',
          'This dimension contains geographical regions. When making updates, first clear all values and only fill in the highest known resolution(s) of the geographical regions.': 'This dimension contains geographical regions.',
          'This dimension contains time-related data. When making updates, first clear all values and only fill in the highest known resolution(s) of the time-related data.': 'This dimension contains time-related data.',
          "Unable to parse regular expression. You may enter text, but it's not guaranteed to be valid.": "Unable to parse regular expression. You may enter text, but it's not guaranteed to be valid.",
        },
      },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CaseTypeFormUtil.createFormDefinitions', () => {
  it('creates writable fields for column types and grouped dimension messages', () => {
    const fixture = createFixture();
    configureDataService();
    const onClearGroupFields = vi.fn();

    const result = CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
      onClearGroupFields,
    });

    const fieldNames = result.fieldDefinitions.map(field => field.name);
    expect(fieldNames).toContain('col-TEXT');
    expect(fieldNames).toContain('col-GEO_REGION');
    expect(fieldNames).toContain('col-NOMINAL');
    expect(fieldNames).toContain('col-ORGANIZATION');
    expect(fieldNames).toContain('col-TIME_DAY');
    expect(fieldNames).not.toContain('col-GENETIC_PROFILE');
    expect(fieldNames).not.toContain('col-no-write');
    expect(result.fieldDefinitions.find(field => field.name === 'col-TEXT')?.definition).toBe(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD);
    expect(result.fieldDefinitions.find(field => field.name === 'col-GEO_REGION')?.definition).toBe(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE);
    expect(result.fieldDefinitions.find(field => field.name === 'col-REGULAR_LANGUAGE-invalid')?.warningMessage).toBeDefined();
    const organizationField = result.fieldDefinitions.find(field => field.name === 'col-ORGANIZATION');
    if (organizationField?.definition !== FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE) {
      throw new Error('Expected organization autocomplete field');
    }
    expect(organizationField.options.map(option => option.label)).toEqual(['Alpha organization', 'Organization one']);
    const geoField = result.fieldDefinitions.find(field => field.name === 'col-GEO_REGION');
    if (geoField?.definition !== FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE) {
      throw new Error('Expected geographic-region autocomplete field');
    }
    expect(geoField.options[0]?.label).toBe('Region one');

    const geoGroup = result.groupDefinitions.find(group => group.groupKey === 'dimension-geo');
    const timeGroup = result.groupDefinitions.find(group => group.groupKey === 'dimension-time');
    const mixedGroup = result.groupDefinitions.find(group => group.groupKey === 'dimension-mixed');
    expect(geoGroup?.messages).toHaveLength(1);
    expect(timeGroup?.messages).toHaveLength(1);
    expect(mixedGroup?.messages).toHaveLength(1);
    geoGroup?.messages[0]?.onButtonClick?.();
    expect(onClearGroupFields).toHaveBeenCalledWith(['col-GEO_REGION']);

    configureDataService(true, true);
    const codeLabelDefinitions = CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
    });
    const geoFieldWithCodes = codeLabelDefinitions.fieldDefinitions.find(field => field.name === 'col-GEO_REGION');
    if (geoFieldWithCodes?.definition !== FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE) {
      throw new Error('Expected geographic-region autocomplete field');
    }
    expect(geoFieldWithCodes.options[0]?.label).toBe('R1');
  });

  it('filters included fields, applies enabled-column state, and skips unavailable lookup options', () => {
    const fixture = createFixture();
    configureDataService(false);
    const includedColId = 'col-TEXT';
    const result = CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
      enabledColIds: [],
      includedColIds: [includedColId],
    });

    expect(result.fieldDefinitions).toHaveLength(1);
    expect(result.fieldDefinitions[0]?.name).toBe(includedColId);
    expect(result.fieldDefinitions[0]?.disabled).toBe(true);
    expect(CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
      enabledColIds: [includedColId],
      includedColIds: [includedColId],
    }).fieldDefinitions[0]?.disabled).toBe(false);
    expect(CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
    }).fieldDefinitions.some(field => field.name === 'col-GEO_REGION')).toBe(false);
    expect(CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: fixture.completeCaseType,
    }).fieldDefinitions.some(field => field.name === 'col-NOMINAL')).toBe(false);
  });
});

describe('CaseTypeFormUtil.createYupSchema', () => {
  it('creates schema fields for writable column types and excludes non-editable types and columns', () => {
    const { columns, completeCaseType } = createFixture();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const schema = CaseTypeFormUtil.createYupSchema({ completeCaseType });
    const fields = schema.describe().fields;

    expect(fields).toHaveProperty('col-DECIMAL_0');
    expect(fields).toHaveProperty('col-GEO_LATLON');
    expect(fields).toHaveProperty('col-TIME_DAY');
    expect(fields).toHaveProperty('col-REGULAR_LANGUAGE-invalid');
    expect(fields).not.toHaveProperty('col-GENETIC_DISTANCE');
    expect(fields).not.toHaveProperty('col-GENETIC_READS');
    expect(fields).not.toHaveProperty('col-GENETIC_SEQUENCE');
    expect(fields).not.toHaveProperty('col-no-write');
    expect(warn).toHaveBeenCalled();

    expect(CaseTypeFormUtil.createYupSchema({
      completeCaseType,
      includedColIds: [columns[0]?.col.id],
    }).describe().fields).toHaveProperty(columns[0]?.col.id);
  });

  it('validates all supported value types and normalizes optional decimal and date values', async () => {
    const { columns, completeCaseType } = createFixture();
    const schema = CaseTypeFormUtil.createYupSchema({ completeCaseType });
    const emptyValues = Object.fromEntries(columns.map(({ col }) => [col.id, '']));
    emptyValues['col-REGULAR_LANGUAGE'] = 'ABC';
    emptyValues['col-REGULAR_LANGUAGE-invalid'] = '';
    emptyValues['col-TIME_DAY'] = new Date('2024-01-02T00:00:00.000Z') as unknown as string;

    const emptyResult = await schema.validate(emptyValues);
    expect(emptyResult['col-DECIMAL_0']).toBeNull();
    expect(emptyResult['col-DECIMAL_1']).toBeNull();
    expect(emptyResult['col-DECIMAL_2']).toBeNull();
    expect(emptyResult['col-DECIMAL_3']).toBeNull();
    expect(emptyResult['col-DECIMAL_4']).toBeNull();
    expect(emptyResult['col-DECIMAL_5']).toBeNull();
    expect(emptyResult['col-DECIMAL_6']).toBeNull();

    const populatedResult = await schema.validate({
      ...emptyValues,
      'col-DECIMAL_0': '0',
      'col-TIME_DAY': new Date('2024-01-02T00:00:00.000Z'),
    });
    expect(populatedResult['col-DECIMAL_0']).toBe('0');
    expect(populatedResult['col-TIME_DAY']).toBe('2024-01-02T00:00:00.000Z');

    const invalidDateResult = await schema.validate({
      ...emptyValues,
      'col-TIME_DAY': '',
    });
    expect(invalidDateResult['col-TIME_DAY']).toBeNull();
  });

});
