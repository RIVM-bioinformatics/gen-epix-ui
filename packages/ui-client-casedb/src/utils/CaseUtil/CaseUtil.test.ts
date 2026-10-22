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
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import {
  CaseDbCaseApi,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseDataCollectionLink,
  CaseDbCaseRights,
  CaseDbCaseSetMember,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { DataService } from '../../classes/services/DataService';
import type { CaseDbConfig } from '../../models/config.models';

import { CaseUtil } from './CaseUtil';

const createCompleteCaseType = (refCols: Record<string, CaseDbRefCol> = {}): CaseDbCompleteCaseType => ({
  id: 'case-type-1',
  name: 'Case type one',
  ref_cols: refCols,
} as unknown as CaseDbCompleteCaseType);

const createTextCaseType = (): CaseDbCompleteCaseType => createCompleteCaseType({
  'ref-1': {
    code: 'text',
    col_type: CaseDbColType.TEXT,
    id: 'ref-1',
    ref_dim_id: 'ref-dim',
  },
});

const createCaseRights = (
  caseId: string,
  options: {
    readonly add?: string[];
    readonly full?: boolean;
    readonly shared?: string[];
  } = {},
): CaseDbCaseRights => ({
  add_data_collection_ids: options.add ?? [],
  can_delete: false,
  case_id: caseId,
  case_type_id: 'case-type-1',
  created_in_data_collection_id: 'source-collection',
  data_collection_ids: [],
  is_full_access: options.full ?? false,
  read_col_ids: [],
  remove_data_collection_ids: [],
  shared_in_data_collection_ids: options.shared ?? [],
  write_col_ids: [],
});

const createDataService = (data: {
  conceptsById?: Record<string, CaseDbConcept>;
  organizationsById?: Record<string, CaseDbOrganization>;
  regionsById?: Record<string, CaseDbRegion>;
  regionSets?: Record<string, CaseDbRegionSet>;
} = {}) => {
  container.registerInstance(DataService, {
    data: {
      conceptsById: data.conceptsById ?? {},
      organizationsById: data.organizationsById ?? {},
      regionsById: data.regionsById ?? {},
      regionSets: data.regionSets ?? {},
    },
  } as unknown as DataService);
};

const createLinkHarness = (options: {
  readonly error?: Error;
  readonly members?: CaseDbCaseSetMember[];
  readonly rights?: CaseDbCaseRights[];
} = {}) => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const caseSetMembersPostQuery = vi.fn(async () => {
    if (options.error) {
      return Promise.reject<{ data: CaseDbCaseSetMember[] }>(options.error);
    }
    return Promise.resolve({ data: options.members ?? [] });
  });
  const retrieveCaseRights = vi.fn(async () => {
    if (options.error) {
      return Promise.reject<{ data: CaseDbCaseRights[] }>(options.error);
    }
    return Promise.resolve({ data: options.rights ?? [] });
  });
  const caseDataCollectionLinksPostSome = vi.fn(async (_links: CaseDbCaseDataCollectionLink[]) => {
    if (options.error) {
      return Promise.reject<void>(options.error);
    }
    return Promise.resolve();
  });
  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(CaseDbCaseApi, {
    caseDataCollectionLinksPostSome,
    caseSetMembersPostQuery,
    retrieveCaseRights,
  } as unknown as CaseDbCaseApi);
  const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys');
  const notificationService = container.resolve(NotificationService);
  const showNotification = vi.spyOn(notificationService, 'showNotification').mockReturnValue('notification-1');
  const fulfillNotification = vi.spyOn(notificationService, 'fulfillNotification').mockImplementation(() => undefined);

  return {
    caseDataCollectionLinksPostSome,
    caseSetMembersPostQuery,
    fulfillNotification,
    invalidateQueryKeys,
    queryClientService,
    retrieveCaseRights,
    showNotification,
  };
};

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          '{{dataMissingCharacter}} (missing)': '{{dataMissingCharacter}} (missing)',
          'Applying sharing to the cases': 'Applying sharing to the cases',
          'Sharing could not be applied to selected cases due to an error.': 'Sharing could not be applied to selected cases due to an error.',
          'Sharing has been applied to the cases': 'Sharing has been applied to the cases',
          'Sharing has not been applied to the cases because sharing has already been applied.': 'Sharing has not been applied to the cases because sharing has already been applied.',
          'Sharing has not been applied to the cases because the event is not shared.': 'Sharing has not been applied to the cases because the event is not shared.',
          'Sharing has not been applied to the cases because there are no cases in the event.': 'Sharing has not been applied to the cases because there are no cases in the event.',
        },
      },
    },
  });
});

afterEach(() => vi.restoreAllMocks());

describe('CaseUtil.applyDataCollectionLinks', () => {
  it('rejects calls that provide neither case IDs nor a case-set ID', async () => {
    const harness = createLinkHarness();

    await expect(CaseUtil.applyDataCollectionLinks({
      caseSetDataCollectionIds: ['collection-1'],
      caseTypeId: 'case-type-1',
    })).rejects.toThrow('Either caseSetId or caseIds must be provided');

    expect(harness.showNotification).not.toHaveBeenCalled();
  });

  it('returns early when collection IDs are missing or empty', async () => {
    const harness = createLinkHarness();

    await CaseUtil.applyDataCollectionLinks({
      caseIds: ['case-1'],
      caseSetDataCollectionIds: undefined,
      caseTypeId: 'case-type-1',
    });
    expect(harness.fulfillNotification).toHaveBeenCalledExactlyOnceWith('notification-1', 'Sharing has not been applied to the cases because the event is not shared.', 'info');
    expect(harness.retrieveCaseRights).not.toHaveBeenCalled();

    harness.fulfillNotification.mockClear();
    await CaseUtil.applyDataCollectionLinks({
      caseIds: ['case-1'],
      caseSetDataCollectionIds: [],
      caseTypeId: 'case-type-1',
    });
    expect(harness.retrieveCaseRights).not.toHaveBeenCalled();
  });

  it('returns early when the selected case set has no members', async () => {
    const harness = createLinkHarness({ members: [] });

    await CaseUtil.applyDataCollectionLinks({
      caseSetDataCollectionIds: ['collection-1'],
      caseSetId: 'case-set-1',
      caseTypeId: 'case-type-1',
    });

    expect(harness.caseSetMembersPostQuery).toHaveBeenCalledWith({
      invert: false,
      key: 'case_set_id',
      members: ['case-set-1'],
      type: 'UUID_SET',
    }, null, null);
    expect(harness.retrieveCaseRights).not.toHaveBeenCalled();
    expect(harness.fulfillNotification.mock.calls[0]?.[2]).toBe('info');
  });

  it('applies sharing to the members of a case set', async () => {
    const harness = createLinkHarness({
      members: [{ case_id: 'case-1', case_set_id: 'case-set-1' }],
      rights: [createCaseRights('case-1', { full: true })],
    });

    await CaseUtil.applyDataCollectionLinks({
      caseSetDataCollectionIds: ['collection-1'],
      caseSetId: 'case-set-1',
      caseTypeId: 'case-type-1',
    });

    expect(harness.caseDataCollectionLinksPostSome).toHaveBeenCalledWith([
      { case_id: 'case-1', data_collection_id: 'collection-1' },
    ]);
  });

  it('returns early when a direct case selection is empty', async () => {
    const harness = createLinkHarness();

    await CaseUtil.applyDataCollectionLinks({
      caseIds: [],
      caseSetDataCollectionIds: ['collection-1'],
      caseTypeId: 'case-type-1',
    });

    expect(harness.retrieveCaseRights).not.toHaveBeenCalled();
    expect(harness.fulfillNotification.mock.calls[0]?.[2]).toBe('info');
  });

  it('adds missing links using full and restricted case rights', async () => {
    const rights = [
      createCaseRights('case-1', { full: true, shared: ['collection-1'] }),
      createCaseRights('case-2', { add: ['collection-1'] }),
      createCaseRights('case-3', { add: [], shared: [] }),
    ];
    const harness = createLinkHarness({ rights });

    await CaseUtil.applyDataCollectionLinks({
      caseIds: ['case-1', 'case-2', 'case-3'],
      caseSetDataCollectionIds: ['collection-1', 'collection-2'],
      caseTypeId: 'case-type-1',
    });

    expect(harness.retrieveCaseRights).toHaveBeenCalledWith({
      case_ids: ['case-1', 'case-2', 'case-3'],
      case_type_id: 'case-type-1',
    });
    expect(harness.caseDataCollectionLinksPostSome).toHaveBeenCalledWith([
      { case_id: 'case-1', data_collection_id: 'collection-2' },
      { case_id: 'case-2', data_collection_id: 'collection-1' },
    ]);
    expect(harness.invalidateQueryKeys).toHaveBeenCalled();
    expect(harness.fulfillNotification.mock.calls.at(-1)?.[2]).toBe('success');
  });

  it('reports that sharing is already applied when no links can be added', async () => {
    const rights = [createCaseRights('case-1', { shared: ['collection-1'] })];
    const harness = createLinkHarness({ rights });

    await CaseUtil.applyDataCollectionLinks({
      caseIds: ['case-1'],
      caseSetDataCollectionIds: ['collection-1'],
      caseTypeId: 'case-type-1',
    });

    expect(harness.caseDataCollectionLinksPostSome).not.toHaveBeenCalled();
    expect(harness.fulfillNotification.mock.calls[0]?.[2]).toBe('info');
  });

  it('notifies when case-rights retrieval fails', async () => {
    const harness = createLinkHarness({ error: new Error('Rights unavailable') });

    await CaseUtil.applyDataCollectionLinks({
      caseIds: ['case-1'],
      caseSetDataCollectionIds: ['collection-1'],
      caseTypeId: 'case-type-1',
    });

    expect(harness.fulfillNotification.mock.calls.at(-1)?.[2]).toBe('error');
  });
});

describe('CaseUtil row values', () => {
  it('formats missing values according to the machine-readable option', () => {
    const dataMissingCharacter = DependencyContainerUtil.resolveConfig<CaseDbConfig>().epi.DATA_MISSING_CHARACTER;
    const missing = CaseUtil.getMissingRowValue(undefined, false);
    const machineReadable = CaseUtil.getMissingRowValue('', true);

    expect(missing).toEqual({
      full: `${dataMissingCharacter} (missing)`,
      isMissing: true,
      long: dataMissingCharacter,
      raw: undefined,
      short: dataMissingCharacter,
    });
    expect(machineReadable).toEqual({
      full: ' (missing)',
      isMissing: true,
      long: '',
      raw: '',
      short: '',
    });
  });

  it('uses the missing-value representation for empty unmapped content', () => {
    const col: CaseDbCol = { id: 'col-1', ref_col_id: 'ref-1' } as CaseDbCol;
    const completeCaseType = createTextCaseType();

    expect(CaseUtil.getRowValue({ 'col-1': '' }, col, completeCaseType)).toEqual(CaseUtil.getMissingRowValue('', false));
  });

  it('returns complete row values for ordinary content and respects machine-readable output', () => {
    const col: CaseDbCol = { id: 'col-1', ref_col_id: 'ref-1' } as CaseDbCol;
    const completeCaseType = createTextCaseType();

    expect(CaseUtil.getRowValue({ 'col-1': 'value' }, col, completeCaseType)).toEqual({
      full: 'value',
      isMissing: false,
      long: 'value',
      raw: 'value',
      short: 'value',
    });
    expect(CaseUtil.getRowValue({}, col, completeCaseType, true).full).toBe(' (missing)');
  });

  it('uses organization, region, and concept lookup values', () => {
    const orgRefCol = { code: 'org', col_type: CaseDbColType.ORGANIZATION, id: 'ref-org', ref_dim_id: 'ref-dim' } as CaseDbRefCol;
    const regionRefCol = { code: 'region', col_type: CaseDbColType.GEO_REGION, id: 'ref-region', ref_dim_id: 'ref-dim', region_set_id: 'region-set-1' } as CaseDbRefCol;
    const conceptRefCol = { code: 'concept', col_type: CaseDbColType.NOMINAL, concept_set_id: 'concept-set-1', id: 'ref-concept', ref_dim_id: 'ref-dim' } as CaseDbRefCol;
    createDataService({
      conceptsById: {
        'concept-1': { code: 'C1', concept_set_id: 'concept-set-1', id: 'concept-1', name: 'Concept one' },
      },
      organizationsById: {
        'organization-1': { code: 'O1', id: 'organization-1', name: 'Organization one' },
      },
      regionsById: {
        'region-1': { code: 'R1', id: 'region-1', name: 'Region one' } as CaseDbRegion,
      },
      regionSets: {
        'region-set-1': { code: 'RS1', id: 'region-set-1', name: 'Region set', region_code_as_label: true, resolution: 1 },
      },
    });

    expect(CaseUtil.getMappedValue('organization-1', { id: 'org-col', ref_col_id: 'ref-org' } as CaseDbCol, createCompleteCaseType({ [orgRefCol.id]: orgRefCol })).long).toBe('Organization one');
    expect(CaseUtil.getMappedValue('region-1', { id: 'region-col', ref_col_id: 'ref-region' } as CaseDbCol, createCompleteCaseType({ [regionRefCol.id]: regionRefCol })).long).toBe('R1');
    expect(CaseUtil.getMappedValue('concept-1', { id: 'concept-col', ref_col_id: 'ref-concept' } as CaseDbCol, createCompleteCaseType({ [conceptRefCol.id]: conceptRefCol })).long).toBe('Concept one');
    expect(CaseUtil.getRowValue(
      { 'org-col': 'organization-1' },
      { id: 'org-col', ref_col_id: 'ref-org' } as CaseDbCol,
      createCompleteCaseType({ [orgRefCol.id]: orgRefCol }),
    ).long).toBe('Organization one');

    createDataService({
      regionsById: {
        'region-1': { code: 'R1', id: 'region-1', name: 'Region one' } as CaseDbRegion,
      },
      regionSets: {
        'region-set-1': { code: 'RS1', id: 'region-set-1', name: 'Region set', region_code_as_label: false, resolution: 1 },
      },
    });
    expect(CaseUtil.getMappedValue('region-1', { id: 'region-col', ref_col_id: 'ref-region' } as CaseDbCol, createCompleteCaseType({ [regionRefCol.id]: regionRefCol })).long).toBe('Region one');
  });

  it('falls back to missing values for absent mappings and unmapped column types', () => {
    const missingOrgRef = { code: 'org', col_type: CaseDbColType.ORGANIZATION, id: 'ref-org', ref_dim_id: 'ref-dim' } as CaseDbRefCol;
    const missingRegionRef = { code: 'region', col_type: CaseDbColType.GEO_REGION, id: 'ref-region', ref_dim_id: 'ref-dim', region_set_id: 'missing-set' } as CaseDbRefCol;
    const missingConceptRef = { code: 'concept', col_type: CaseDbColType.NOMINAL, concept_set_id: 'missing-set', id: 'ref-concept', ref_dim_id: 'ref-dim' } as CaseDbRefCol;
    createDataService();

    expect(CaseUtil.getMappedValue('unknown', { id: 'org', ref_col_id: 'ref-org' } as CaseDbCol, createCompleteCaseType({ [missingOrgRef.id]: missingOrgRef })).isMissing).toBe(true);
    expect(CaseUtil.getMappedValue('unknown', { id: 'region', ref_col_id: 'ref-region' } as CaseDbCol, createCompleteCaseType({ [missingRegionRef.id]: missingRegionRef })).isMissing).toBe(true);
    expect(CaseUtil.getMappedValue('unknown', { id: 'concept', ref_col_id: 'ref-concept' } as CaseDbCol, createCompleteCaseType({ [missingConceptRef.id]: missingConceptRef })).isMissing).toBe(true);
    const textRefCol = { code: 'text', col_type: CaseDbColType.TEXT, id: 'ref-text', ref_dim_id: 'ref-dim' } as CaseDbRefCol;
    expect(CaseUtil.getMappedValue('value', { id: 'text', ref_col_id: 'ref-text' } as CaseDbCol, createCompleteCaseType({ [textRefCol.id]: textRefCol })).isMissing).toBe(true);
    expect(CaseUtil.getMappedValue('', { id: 'text', ref_col_id: 'ref-text' } as CaseDbCol, createCompleteCaseType({ [textRefCol.id]: textRefCol }), true).long).toBe('');
  });
});
