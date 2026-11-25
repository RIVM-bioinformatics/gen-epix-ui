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
  useCareSiteOptionsQuery,
  useCareSiteQuery,
} from './useCareSiteQuery';

const CARE_SITES_PATH = '/v1/CareSites';

const Probe = () => {
  const query = useCareSiteQuery();
  const { options } = useCareSiteOptionsQuery();
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

describe('useCareSiteQuery', () => {
  it('maps care sites to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', CARE_SITES_PATH, () => Response.json([
      { care_site_id: 'id-5', care_site_name: 'Charlie' },
      { care_site_id: 'id-3', care_site_name: '   ' },
      { care_site_id: 'id-4' },
      { care_site_id: 'id-6', care_site_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
