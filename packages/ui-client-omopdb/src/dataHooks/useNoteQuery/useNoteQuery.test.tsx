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
  useNoteOptionsQuery,
  useNoteQuery,
} from './useNoteQuery';

const NOTES_PATH = '/v1/Notes';

const Probe = () => {
  const query = useNoteQuery();
  const { options } = useNoteOptionsQuery();
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

describe('useNoteQuery', () => {
  it('maps notes to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', NOTES_PATH, () => Response.json([
      { note_id: 'id-2' },
      { note_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
