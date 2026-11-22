import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbDataCollection } from '@gen-epix/api-casedb';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../test/lib';

import { CaseAbacContext } from './CaseAbacContext';
import { useCaseAbacContext } from './useCaseAbacContext';

const PROBE_TEST_ID = 'useCaseAbacContext-probe';

const dataCollection = { id: 'dc-1', name: 'Data collection 1' } satisfies CaseDbDataCollection;

const caseAbac: CaseAbacContext = {
  itemDataCollectionLinks: [],
  rights: [],
  userDataCollectionOptions: [{ label: 'Data collection 1', value: 'dc-1' }],
  userDataCollections: [dataCollection],
  userDataCollectionsMap: new Map([[dataCollection.id, dataCollection]]),
};

const UseCaseAbacContextProbe = () => {
  const value = useCaseAbacContext();
  return (
    <pre {...TestIdUtil.createAttributes(PROBE_TEST_ID)}>
      {value.userDataCollections.map(item => item.name).join(',')}
    </pre>
  );
};

describe('useCaseAbacContext', () => {
  it('returns the CaseAbacContext value provided by the nearest provider', async () => {
    const screen = await renderComponent(
      <CaseAbacContext value={caseAbac}>
        <UseCaseAbacContextProbe />
      </CaseAbacContext>,
    );

    expect(screen.getByTestId(PROBE_TEST_ID).element().textContent).toBe('Data collection 1');
  });
});
