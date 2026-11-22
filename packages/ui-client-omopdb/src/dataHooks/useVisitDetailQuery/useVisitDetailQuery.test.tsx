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
  useVisitDetailOptionsQuery,
  useVisitDetailQuery,
} from './useVisitDetailQuery';

const VISIT_DETAILS_PATH = '/v1/VisitDetails';

const Probe = () => {
  const query = useVisitDetailQuery();
  const { options } = useVisitDetailOptionsQuery();
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

describe('useVisitDetailQuery', () => {
  it('maps visit details to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', VISIT_DETAILS_PATH, () => Response.json([
      { visit_detail_id: 'id-2' },
      { visit_detail_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
