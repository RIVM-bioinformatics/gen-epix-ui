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
  useDeathOptionsQuery,
  useDeathQuery,
} from './useDeathQuery';

const DEATHS_PATH = '/v1/Deaths';

const Probe = () => {
  const query = useDeathQuery();
  const { options } = useDeathOptionsQuery();
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

describe('useDeathQuery', () => {
  it('maps deaths to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', DEATHS_PATH, () => Response.json([
      { death_id: 'id-2' },
      { death_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
