import type { CaseDbUser } from '@gen-epix/api-casedb';
import { createRef } from 'react';
import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';

import type { UserRightsDialogRefMethods } from './UserRightsDialog';
import { UserRightsDialog } from './UserRightsDialog';

const USER_NAME = 'User one';

const createUser = (overrides: Partial<CaseDbUser> = {}): CaseDbUser => ({
  id: 'user-1',
  is_active: true,
  name: USER_NAME,
  organization_id: 'org-1',
  roles: [],
  ...overrides,
} as CaseDbUser);

const mockEmptyPolicyApi = () => {
  mockApiRequest('GET', '/v1/organization_access_case_policies', () => Response.json([]));
  mockApiRequest('GET', '/v1/user_access_case_policies', () => Response.json([]));
  mockApiRequest('GET', '/v1/case_type_set_members', () => Response.json([]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([]));
  mockApiRequest('GET', '/v1/col_set_members', () => Response.json([]));
  mockApiRequest('GET', '/v1/cols', () => Response.json([]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
};

const renderUserRightsDialog = async (user: CaseDbUser = createUser()) => {
  const ref = createRef<UserRightsDialogRefMethods>();
  const screen = await renderComponent(<UserRightsDialog ref={ref} />);
  ref.current?.open({ user });
  return screen;
};

describe('UserRightsDialog', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the effective rights title with the user name', async () => {
    mockEmptyPolicyApi();
    const screen = await renderUserRightsDialog();

    await expect.element(screen.getByRole('heading', { name: `Effective rights for ${USER_NAME}` })).toBeInTheDocument();
  });

  it('shows the case access tab selected by default with its table', async () => {
    mockEmptyPolicyApi();
    const screen = await renderUserRightsDialog();

    await expect.element(screen.getByRole('tab', { name: 'Case access', selected: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to the case type access panel and back', async () => {
    mockEmptyPolicyApi();
    const screen = await renderUserRightsDialog();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    await screen.getByRole('tab', { name: 'Case type access' }).click();
    await expect.element(screen.getByRole('tab', { name: 'Case type access', selected: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('Case type access');
    await expect.poll(() => screen.getByRole('table').query()).toBeNull();

    await screen.getByRole('tab', { name: 'Case access' }).click();
    await expect.element(screen.getByRole('tab', { name: 'Case access', selected: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('table')).toBeInTheDocument();
  });
});
