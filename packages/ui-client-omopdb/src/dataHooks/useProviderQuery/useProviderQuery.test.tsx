import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  mockApiRequest,
  renderComponent,
} from '@gen-epix/ui-client-common/test/lib';

import {
  useProviderOptionsQuery,
  useProviderQuery,
} from './useProviderQuery';

const PROVIDERS_PATH = '/v1/Providers';

const Probe = () => {
  const query = useProviderQuery();
  const { options } = useProviderOptionsQuery();
  return (
    <>
      <div data-testid={'query'}>
        {(query.data ?? []).map(row => row.id).join(',')}
      </div>
      <div data-testid={'options'}>
        {options.map(option => `${option.value}:${option.label}`).join(',')}
      </div>
    </>
  );
};

describe('useProviderQuery', () => {
  it('maps providers to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', PROVIDERS_PATH, () => Response.json([
      { provider_id: 'id-5', provider_name: 'Charlie' },
      { provider_id: 'id-3', provider_name: '   ' },
      { provider_id: 'id-4' },
      { provider_id: 'id-6', provider_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
