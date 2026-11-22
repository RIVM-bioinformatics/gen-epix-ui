import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  mockApiRequest,
  renderComponent,
} from '@gen-epix/ui-client-common/test/lib';

import { OmopDbApp } from './OmopDbApp';

describe('OmopDbApp', () => {
  it('renders the welcome page for an unauthenticated user once the feature flags have loaded', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json({ feature_flags: {} }));
    mockApiRequest('GET', '/v1/identity_providers', () => Response.json([]));

    const screen = await renderComponent(
      <OmopDbApp />,
    );

    await expect.element(screen.getByText('Welcome to Gen-EpiX')).toBeInTheDocument();
  });
});
