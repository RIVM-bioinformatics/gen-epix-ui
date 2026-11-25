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
  useProcedureOccurrenceOptionsQuery,
  useProcedureOccurrenceQuery,
} from './useProcedureOccurrenceQuery';

const PROCEDURE_OCCURRENCES_PATH = '/v1/ProcedureOccurrences';

const Probe = () => {
  const query = useProcedureOccurrenceQuery();
  const { options } = useProcedureOccurrenceOptionsQuery();
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

describe('useProcedureOccurrenceQuery', () => {
  it('maps procedure occurrences to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', PROCEDURE_OCCURRENCES_PATH, () => Response.json([
      { procedure_occurrence_id: 'id-2' },
      { procedure_occurrence_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
