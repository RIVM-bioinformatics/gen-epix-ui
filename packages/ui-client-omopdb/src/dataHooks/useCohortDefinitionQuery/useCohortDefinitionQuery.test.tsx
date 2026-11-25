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
  useCohortDefinitionOptionsQuery,
  useCohortDefinitionQuery,
} from './useCohortDefinitionQuery';

const COHORT_DEFINITIONS_PATH = '/v1/CohortDefinitions';

const Probe = () => {
  const query = useCohortDefinitionQuery();
  const { options } = useCohortDefinitionOptionsQuery();
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

describe('useCohortDefinitionQuery', () => {
  it('maps cohort definitions to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', COHORT_DEFINITIONS_PATH, () => Response.json([
      { cohort_definition_id: 'id-5', cohort_definition_name: 'Charlie' },
      { cohort_definition_id: 'id-3', cohort_definition_name: '   ' },
      { cohort_definition_id: 'id-4' },
      { cohort_definition_id: 'id-6', cohort_definition_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
