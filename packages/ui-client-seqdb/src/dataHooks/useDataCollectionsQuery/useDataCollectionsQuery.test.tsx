import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
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
  useDataCollectionOptionsQuery,
  useDataCollectionsQuery,
} from './useDataCollectionsQuery';

const DATA_COLLECTIONS_PATH = '/v1/data_collections';

const Probe = () => {
  const query = useDataCollectionsQuery();
  const { options } = useDataCollectionOptionsQuery();
  return (
    <>
      <div {...TestIdUtil.createAttributes('status')}>
        {query.status}
      </div>
      <div {...TestIdUtil.createAttributes('query')}>
        {(query.data ?? []).map(row => row.id).join(',')}
      </div>
      <div {...TestIdUtil.createAttributes('error')}>
        {query.error?.message}
      </div>
      <div {...TestIdUtil.createAttributes('options')}>
        {options.map(option => `${option.value}:${option.label}`).join(',')}
      </div>
    </>
  );
};

describe('useDataCollectionsQuery', () => {
  it('returns data collections and creates options labelled by name with an ID fallback', async () => {
    mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([
      { id: 'dc-2', name: 'Beta' },
      { id: 'dc-1' },
      { id: 'dc-3', name: '' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('dc-2,dc-1,dc-3');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('dc-2:Beta,dc-1:dc-1,dc-3:dc-3');
  });

  it('returns an empty list and no options when the API has no data collections', async () => {
    mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a data collection has no ID', async () => {
    mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([
      { id: 'dc-1', name: 'Alpha' },
      { name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a data collection without an ID.');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });
});
