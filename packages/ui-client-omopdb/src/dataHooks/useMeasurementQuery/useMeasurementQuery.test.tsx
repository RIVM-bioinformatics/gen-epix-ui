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
  useMeasurementOptionsQuery,
  useMeasurementQuery,
} from './useMeasurementQuery';

const MEASUREMENTS_PATH = '/v1/Measurements';

const Probe = () => {
  const query = useMeasurementQuery();
  const { options } = useMeasurementOptionsQuery();
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

describe('useMeasurementQuery', () => {
  it('maps measurements to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', MEASUREMENTS_PATH, () => Response.json([
      { measurement_id: 'id-2' },
      { measurement_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
