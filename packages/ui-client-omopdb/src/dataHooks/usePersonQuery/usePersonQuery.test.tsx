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
  usePersonOptionsQuery,
  usePersonQuery,
} from './usePersonQuery';

const PERSONS_PATH = '/v1/Persons';

const Probe = () => {
  const query = usePersonQuery();
  const { options } = usePersonOptionsQuery();
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

describe('usePersonQuery', () => {
  it('maps persons to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', PERSONS_PATH, () => Response.json([
      { person_id: 'id-2' },
      { person_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
