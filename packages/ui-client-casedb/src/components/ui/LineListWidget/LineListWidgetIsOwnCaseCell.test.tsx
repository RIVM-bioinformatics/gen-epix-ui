import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { LineListIsOwnCaseService } from '../../../classes/services/LineListService/LineListIsOwnCaseService';
import { createDashboardCase } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { LineListWidgetIsOwnCaseCell } from './LineListWidgetIsOwnCaseCell';

const IS_OWN_CASES_PATH = '/v1/retrieve/is_own_cases';
const CASE_TYPE_ID = 'case-type-1';
const PROGRESS_SELECTOR = '[role="progressbar"]';

const renderCell = async (caseId: string) => {
  const row = createDashboardCase({ id: caseId });
  const screen = await renderComponent(
    <LineListWidgetIsOwnCaseCell row={row} />,
  );
  return { row, screen };
};

// The cell only reads the ownership; the table normally triggers the fetch through loadRange for visible rows.
const loadOwnership = async (caseId: string) => {
  await container.resolve(LineListIsOwnCaseService).loadRange([caseId], CASE_TYPE_ID);
};

describe('LineListWidgetIsOwnCaseCell', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows a progress indicator while the ownership is loading', async () => {
    mockApiRequest('POST', IS_OWN_CASES_PATH, async () => new Promise<Response>(() => undefined));
    const { screen } = await renderCell('case-loading');

    await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the corporate icon when the case is owned by the own organization', async () => {
    const caseId = 'case-own';
    mockApiRequest('POST', IS_OWN_CASES_PATH, () => Response.json({ [caseId]: true }));
    const { screen } = await renderCell(caseId);
    await loadOwnership(caseId);

    await vi.waitFor(() => {
      expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    });
    await vi.waitFor(() => {
      expect(document.querySelector('svg')).not.toBeNull();
    });
    await expect.element(screen.getByText('?')).not.toBeInTheDocument();
  });

  it('shows neither an icon nor an error when the case is not owned by the own organization', async () => {
    const caseId = 'case-not-own';
    mockApiRequest('POST', IS_OWN_CASES_PATH, () => Response.json({ [caseId]: false }));
    const { screen } = await renderCell(caseId);
    await loadOwnership(caseId);

    await vi.waitFor(() => {
      expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    });
    expect(document.querySelector('svg')).toBeNull();
    await expect.element(screen.getByText('?')).not.toBeInTheDocument();
  });

  it('shows a question mark when the ownership cannot be retrieved', async () => {
    const caseId = 'case-error';
    mockApiRequest('POST', IS_OWN_CASES_PATH, () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const { screen } = await renderCell(caseId);
    await loadOwnership(caseId);

    await expect.element(screen.getByText('?')).toBeInTheDocument();
    expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    expect(document.querySelector('svg')).toBeNull();
  });
});
