import type { CommonDbUser } from '@gen-epix/api-commondb';

import { mockApiRequest } from '../requests/mockApi';

export const createUser = (overrides: Partial<CommonDbUser> = {}): { readonly id: string } & CommonDbUser => ({
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
  ...overrides,
});

export const mockUsers = (users = [createUser()]) => {
  mockApiRequest('GET', '/v1/users', () => Response.json(users));
};
