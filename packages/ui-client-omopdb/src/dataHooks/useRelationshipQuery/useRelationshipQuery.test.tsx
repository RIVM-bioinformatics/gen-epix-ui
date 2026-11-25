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
  useRelationshipOptionsQuery,
  useRelationshipQuery,
} from './useRelationshipQuery';

const RELATIONSHIPS_PATH = '/v1/Relationships';

const Probe = () => {
  const query = useRelationshipQuery();
  const { options } = useRelationshipOptionsQuery();
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

describe('useRelationshipQuery', () => {
  it('maps relationships to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', RELATIONSHIPS_PATH, () => Response.json([
      { relationship_id: 'id-5', relationship_name: 'Charlie' },
      { relationship_id: 'id-3', relationship_name: '   ' },
      { relationship_id: 'id-4' },
      { relationship_id: 'id-6', relationship_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
