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
  useNoteNlpOptionsQuery,
  useNoteNlpQuery,
} from './useNoteNlpQuery';

const NOTE_NLPS_PATH = '/v1/NoteNlps';

const Probe = () => {
  const query = useNoteNlpQuery();
  const { options } = useNoteNlpOptionsQuery();
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

describe('useNoteNlpQuery', () => {
  it('maps note NLPs to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', NOTE_NLPS_PATH, () => Response.json([
      { note_nlp_id: 'id-2' },
      { note_nlp_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
