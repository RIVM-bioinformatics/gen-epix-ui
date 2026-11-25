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
  useVisitOccurrenceOptionsQuery,
  useVisitOccurrenceQuery,
} from './useVisitOccurrenceQuery';

const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';

const Probe = () => {
  const query = useVisitOccurrenceQuery();
  const { options } = useVisitOccurrenceOptionsQuery();
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

describe('useVisitOccurrenceQuery', () => {
  it('maps visit occurrences to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => Response.json([
      { visit_occurrence_id: 'id-2' },
      { visit_occurrence_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
