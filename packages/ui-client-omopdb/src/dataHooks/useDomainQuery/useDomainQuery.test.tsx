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
  useDomainOptionsQuery,
  useDomainQuery,
} from './useDomainQuery';

const DOMAINS_PATH = '/v1/Domains';

const Probe = () => {
  const query = useDomainQuery();
  const { options } = useDomainOptionsQuery();
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

describe('useDomainQuery', () => {
  it('maps domains to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', DOMAINS_PATH, () => Response.json([
      { domain_id: 'id-5', domain_name: 'Charlie' },
      { domain_id: 'id-3', domain_name: '   ' },
      { domain_id: 'id-4' },
      { domain_id: 'id-6', domain_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
