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
  useEpisodeOptionsQuery,
  useEpisodeQuery,
} from './useEpisodeQuery';

const EPISODES_PATH = '/v1/Episodes';

const Probe = () => {
  const query = useEpisodeQuery();
  const { options } = useEpisodeOptionsQuery();
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

describe('useEpisodeQuery', () => {
  it('maps episodes to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', EPISODES_PATH, () => Response.json([
      { episode_id: 'id-2' },
      { episode_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
