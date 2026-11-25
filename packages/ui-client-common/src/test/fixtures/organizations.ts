import type { CommonDbOrganization } from '@gen-epix/api-commondb';

import { mockApiRequest } from '../requests/mockApi';

export const createOrganization = (overrides: Partial<CommonDbOrganization> = {}): CommonDbOrganization => ({
  code: 'example',
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Example organization',
  ...overrides,
});

export const mockOrganizations = (organizations = [createOrganization()]) => {
  mockApiRequest('GET', '/v1/organizations', () => Response.json(organizations));
};
