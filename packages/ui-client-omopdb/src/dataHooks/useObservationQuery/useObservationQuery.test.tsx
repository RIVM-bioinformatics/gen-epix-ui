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
  useObservationOptionsQuery,
  useObservationQuery,
} from './useObservationQuery';

const OBSERVATIONS_PATH = '/v1/Observations';

const Probe = () => {
  const query = useObservationQuery();
  const { options } = useObservationOptionsQuery();
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

describe('useObservationQuery', () => {
  it('maps observations to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', OBSERVATIONS_PATH, () => Response.json([
      { observation_id: 'id-2' },
      { observation_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
