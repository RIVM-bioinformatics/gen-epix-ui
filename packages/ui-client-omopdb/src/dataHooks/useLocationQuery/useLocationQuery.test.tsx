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
  useLocationOptionsQuery,
  useLocationQuery,
} from './useLocationQuery';

const LOCATIONS_PATH = '/v1/Locations';

const Probe = () => {
  const query = useLocationQuery();
  const { options } = useLocationOptionsQuery();
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

describe('useLocationQuery', () => {
  it('maps locations to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', LOCATIONS_PATH, () => Response.json([
      { location_id: 'id-2' },
      { location_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
