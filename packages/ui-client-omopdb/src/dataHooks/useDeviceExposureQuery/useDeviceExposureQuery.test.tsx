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
  useDeviceExposureOptionsQuery,
  useDeviceExposureQuery,
} from './useDeviceExposureQuery';

const DEVICE_EXPOSURES_PATH = '/v1/DeviceExposures';

const Probe = () => {
  const query = useDeviceExposureQuery();
  const { options } = useDeviceExposureOptionsQuery();
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

describe('useDeviceExposureQuery', () => {
  it('maps device exposures to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', DEVICE_EXPOSURES_PATH, () => Response.json([
      { device_exposure_id: 'id-2' },
      { device_exposure_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
