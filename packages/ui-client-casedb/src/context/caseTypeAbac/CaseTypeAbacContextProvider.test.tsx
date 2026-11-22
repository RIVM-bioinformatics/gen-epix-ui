import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../test/lib';

import { CaseTypeAbacContextProvider } from './CaseTypeAbacContextProvider';
import type { CaseTypeAbacContext } from './CaseTypeAbacContext';
import { useCaseTypeAbacContext } from './useCaseTypeAbacContext';

const PROBE_TEST_ID = 'CaseTypeAbacContextProvider-probe';

const dataCollectionAlpha = { id: 'dc-alpha', name: 'Alpha' } satisfies CaseDbDataCollection;
const dataCollectionBeta = { id: 'dc-beta', name: 'Beta' } satisfies CaseDbDataCollection;
const dataCollectionCharlie = { id: 'dc-charlie', name: 'Charlie' } satisfies CaseDbDataCollection;

const createAccess = (
  dataCollectionId: string,
  readColIds: string[],
  writeColIds: string[],
): CaseDbCaseTypeAccessAbac => ({
  add_case: false,
  add_case_set: false,
  case_type_id: 'case-type-1',
  data_collection_id: dataCollectionId,
  is_private: false,
  read_case_set: false,
  read_col_ids: readColIds,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
  write_col_ids: writeColIds,
});

const createCaseTypeAbac = (overrides: Partial<CaseTypeAbacContext> = {}): CaseTypeAbacContext => ({
  caseTypeAccessAbacDict: {},
  userDataCollections: [dataCollectionAlpha, dataCollectionBeta, dataCollectionCharlie],
  userDataCollectionsMap: new Map([
    [dataCollectionAlpha.id, dataCollectionAlpha],
    [dataCollectionBeta.id, dataCollectionBeta],
    [dataCollectionCharlie.id, dataCollectionCharlie],
  ]),
  ...overrides,
});

const ContextProbe = () => {
  const caseTypeAbac = useCaseTypeAbacContext();
  return (
    <pre {...TestIdUtil.createAttributes(PROBE_TEST_ID)}>
      {JSON.stringify({
        caseTypeAccessAbacs: caseTypeAbac.caseTypeAccessAbacs?.map(access => access.data_collection_id),
        effectiveColumnAccessRights: caseTypeAbac.effectiveColumnAccessRights
          ? Object.fromEntries(caseTypeAbac.effectiveColumnAccessRights)
          : undefined,
      })}
    </pre>
  );
};

const renderProvider = async (caseTypeAbac: CaseTypeAbacContext) => {
  const screen = await renderComponent(
    <CaseTypeAbacContextProvider caseTypeAbac={caseTypeAbac}>
      <ContextProbe />
    </CaseTypeAbacContextProvider>,
  );
  const probeText = screen.getByTestId(PROBE_TEST_ID).element().textContent ?? 'null';
  return JSON.parse(probeText) as {
    caseTypeAccessAbacs: string[];
    effectiveColumnAccessRights: Record<string, { read: boolean; write: boolean }>;
  };
};

describe('CaseTypeAbacContextProvider', () => {
  it('sorts access policies by data collection name and keeps only known data collections', async () => {
    const result = await renderProvider(createCaseTypeAbac({
      caseTypeAccessAbacDict: {
        alpha: createAccess('dc-alpha', [], []),
        beta: createAccess('dc-beta', [], []),
        charlie: createAccess('dc-charlie', [], []),
        unknown: createAccess('dc-unknown', ['hidden'], ['hidden']),
      },
    }));

    expect(result.caseTypeAccessAbacs).toEqual(['dc-alpha', 'dc-beta', 'dc-charlie']);
  });

  it('derives effective column access rights from the sorted policies', async () => {
    const result = await renderProvider(createCaseTypeAbac({
      caseTypeAccessAbacDict: {
        alpha: createAccess('dc-alpha', ['read-only'], ['write-only']),
        beta: createAccess('dc-beta', ['shared', 'read-only'], ['shared']),
      },
    }));

    expect(result.effectiveColumnAccessRights).toEqual({
      'read-only': { read: true, write: false },
      shared: { read: true, write: true },
      'write-only': { read: false, write: true },
    });
  });

  it('returns no policies and no column rights when the dictionary is empty', async () => {
    const result = await renderProvider(createCaseTypeAbac());

    expect(result.caseTypeAccessAbacs).toEqual([]);
    expect(result.effectiveColumnAccessRights).toEqual({});
  });
});
