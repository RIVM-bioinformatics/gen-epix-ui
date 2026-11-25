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
  useSpecimenOptionsQuery,
  useSpecimenQuery,
} from './useSpecimenQuery';

const SPECIMENS_PATH = '/v1/Specimens';

const Probe = () => {
  const query = useSpecimenQuery();
  const { options } = useSpecimenOptionsQuery();
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

describe('useSpecimenQuery', () => {
  it('maps specimens to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', SPECIMENS_PATH, () => Response.json([
      { specimen_id: 'id-2' },
      { specimen_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
