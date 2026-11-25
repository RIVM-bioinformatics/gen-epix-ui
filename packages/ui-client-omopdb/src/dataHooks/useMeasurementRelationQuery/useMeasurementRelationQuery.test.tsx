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
  useMeasurementRelationOptionsQuery,
  useMeasurementRelationQuery,
} from './useMeasurementRelationQuery';

const MEASUREMENT_RELATIONS_PATH = '/v1/measurement_relations';

const Probe = () => {
  const query = useMeasurementRelationQuery();
  const { options } = useMeasurementRelationOptionsQuery();
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

describe('useMeasurementRelationQuery', () => {
  it('maps measurement relations to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', MEASUREMENT_RELATIONS_PATH, () => Response.json([
      { measurement_relation_id: 'id-2' },
      { measurement_relation_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
