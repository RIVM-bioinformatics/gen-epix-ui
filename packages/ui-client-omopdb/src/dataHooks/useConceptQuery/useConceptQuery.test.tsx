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
  useConceptOptionsQuery,
  useConceptQuery,
} from './useConceptQuery';

const CONCEPTS_PATH = '/v1/Concepts';

const Probe = () => {
  const query = useConceptQuery();
  const { options } = useConceptOptionsQuery();
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

describe('useConceptQuery', () => {
  it('maps concepts to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
      { concept_id: 'id-5', concept_name: 'Charlie' },
      { concept_id: 'id-3', concept_name: '   ' },
      { concept_id: 'id-4' },
      { concept_id: 'id-6', concept_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
