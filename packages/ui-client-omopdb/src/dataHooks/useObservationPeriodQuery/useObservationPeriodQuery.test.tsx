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
  useObservationPeriodOptionsQuery,
  useObservationPeriodQuery,
} from './useObservationPeriodQuery';

const OBSERVATION_PERIODS_PATH = '/v1/ObservationPeriods';

const Probe = () => {
  const query = useObservationPeriodQuery();
  const { options } = useObservationPeriodOptionsQuery();
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

describe('useObservationPeriodQuery', () => {
  it('maps observation periods to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', OBSERVATION_PERIODS_PATH, () => Response.json([
      { observation_period_id: 'id-2' },
      { observation_period_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
