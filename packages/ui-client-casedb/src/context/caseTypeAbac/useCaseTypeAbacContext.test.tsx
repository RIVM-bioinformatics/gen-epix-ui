import {
  describe,
  expect,
  it,
} from 'vitest';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../test/lib';

import { CaseTypeAbacContext } from './CaseTypeAbacContext';
import type { CaseTypeAbacContext as CaseTypeAbacContextValue } from './CaseTypeAbacContext';
import { useCaseTypeAbacContext } from './useCaseTypeAbacContext';

const PROBE_TEST_ID = 'useCaseTypeAbacContext-probe';

const caseTypeAbac: CaseTypeAbacContextValue = {
  caseTypeAccessAbacDict: {},
  caseTypeAccessAbacs: [],
  userDataCollections: [],
  userDataCollectionsMap: new Map(),
};

const UseCaseTypeAbacContextProbe = () => {
  const value = useCaseTypeAbacContext();
  return (
    <pre {...TestIdUtil.createAttributes(PROBE_TEST_ID)}>
      {`${value.caseTypeAccessAbacs?.length ?? 'none'}`}
    </pre>
  );
};

describe('useCaseTypeAbacContext', () => {
  it('returns the CaseTypeAbacContext value provided by the nearest provider', async () => {
    const screen = await renderComponent(
      <CaseTypeAbacContext value={caseTypeAbac}>
        <UseCaseTypeAbacContextProbe />
      </CaseTypeAbacContext>,
    );

    expect(screen.getByTestId(PROBE_TEST_ID).element().textContent).toBe('0');
  });
});
