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
  useConceptClassOptionsQuery,
  useConceptClassQuery,
} from './useConceptClassQuery';

const CONCEPT_CLASSES_PATH = '/v1/ConceptClasss';

const Probe = () => {
  const query = useConceptClassQuery();
  const { options } = useConceptClassOptionsQuery();
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

describe('useConceptClassQuery', () => {
  it('maps concept classes to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', CONCEPT_CLASSES_PATH, () => Response.json([
      { concept_class_id: 'id-5', concept_class_name: 'Charlie' },
      { concept_class_id: 'id-3', concept_class_name: '   ' },
      { concept_class_id: 'id-4' },
      { concept_class_id: 'id-6', concept_class_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
