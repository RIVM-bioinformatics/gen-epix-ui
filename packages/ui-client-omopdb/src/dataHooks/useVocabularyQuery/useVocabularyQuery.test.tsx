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
  useVocabularyOptionsQuery,
  useVocabularyQuery,
} from './useVocabularyQuery';

const VOCABULARIES_PATH = '/v1/Vocabularies';

const Probe = () => {
  const query = useVocabularyQuery();
  const { options } = useVocabularyOptionsQuery();
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

describe('useVocabularyQuery', () => {
  it('maps vocabularies to rows with an id and creates options with name fallbacks', async () => {
    mockApiRequest('GET', VOCABULARIES_PATH, () => Response.json([
      { vocabulary_id: 'id-5', vocabulary_name: 'Charlie' },
      { vocabulary_id: 'id-3', vocabulary_name: '   ' },
      { vocabulary_id: 'id-4' },
      { vocabulary_id: 'id-6', vocabulary_name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-5,id-3,id-4,id-6');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-6:Alpha,id-5:Charlie,id-3:id-3,id-4:id-4');
  });
});
