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

import { LineListCaseSetMembersService } from '../../../classes/services/LineListService/LineListCaseSetMembersService';
import { createDashboardCase } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { LineListWidgetIsInEventCell } from './LineListWidgetIsInEventCell';

const CASE_SET_MEMBERS_PATH = '/v1/case_set_members/query';
const PROGRESS_SELECTOR = '[role="progressbar"]';

const renderCell = async (caseId: string) => {
  const row = createDashboardCase({ id: caseId });
  const screen = await renderComponent(
    <LineListWidgetIsInEventCell row={row} />,
  );
  return { row, screen };
};

// The cell only reads the membership; the table normally triggers the fetch through loadRange for visible rows.
const loadMembership = async (caseId: string) => {
  await container.resolve(LineListCaseSetMembersService).loadRange([caseId]);
};

describe('LineListWidgetIsInEventCell', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows a progress indicator while the membership is loading', async () => {
    mockApiRequest('POST', CASE_SET_MEMBERS_PATH, async () => new Promise<Response>(() => undefined));
    const { screen } = await renderCell('case-loading');

    await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the collection icon when the case is a member of a case set', async () => {
    const caseId = 'case-member';
    mockApiRequest('POST', CASE_SET_MEMBERS_PATH, () => Response.json([{ case_id: caseId }]));
    const { screen } = await renderCell(caseId);
    await loadMembership(caseId);

    await vi.waitFor(() => {
      expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    });
    await vi.waitFor(() => {
      expect(document.querySelector('svg')).not.toBeNull();
    });
    await expect.element(screen.getByText('?')).not.toBeInTheDocument();
  });

  it('shows neither an icon nor an error when the case is not a member of any case set', async () => {
    const caseId = 'case-non-member';
    mockApiRequest('POST', CASE_SET_MEMBERS_PATH, () => Response.json([]));
    const { screen } = await renderCell(caseId);
    await loadMembership(caseId);

    await vi.waitFor(() => {
      expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    });
    expect(document.querySelector('svg')).toBeNull();
    await expect.element(screen.getByText('?')).not.toBeInTheDocument();
  });

  it('shows a question mark when the membership cannot be retrieved', async () => {
    const caseId = 'case-error';
    mockApiRequest('POST', CASE_SET_MEMBERS_PATH, () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const { screen } = await renderCell(caseId);
    await loadMembership(caseId);

    await expect.element(screen.getByText('?')).toBeInTheDocument();
    expect(document.querySelector(PROGRESS_SELECTOR)).toBeNull();
    expect(document.querySelector('svg')).toBeNull();
  });
});
