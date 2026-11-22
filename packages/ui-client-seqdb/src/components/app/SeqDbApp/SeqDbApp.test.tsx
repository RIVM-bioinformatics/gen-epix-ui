import {
  describe,
  expect,
  it,
} from 'vitest';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';

import { SeqDbApp } from './SeqDbApp';

describe('SeqDbApp', () => {
  it('renders the welcome page for an unauthenticated user once the feature flags have loaded', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json({ feature_flags: {} }));
    mockApiRequest('GET', '/v1/identity_providers', () => Response.json([]));

    const screen = await renderComponent(
      <SeqDbApp />,
    );

    await expect.element(screen.getByText('Welcome to Gen-EpiX')).toBeInTheDocument();
  });
});
